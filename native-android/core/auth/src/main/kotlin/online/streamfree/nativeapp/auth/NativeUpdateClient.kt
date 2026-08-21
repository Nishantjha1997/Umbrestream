package online.streamfree.nativeapp.auth

import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.security.cert.CertificateFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import online.streamfree.nativeapp.network.SafeUrlPolicy
import online.streamfree.nativeapp.network.StreamFreeHttpClient
import online.streamfree.nativeapp.network.StreamFreeHttpTransport

data class NativeUpdateManifest(
  val schemaVersion: Int,
  val packageId: String,
  val versionName: String,
  val versionCode: Long,
  val apkUrl: String,
  val sha256: String,
  val sizeBytes: Long,
  val signingCertificateSha256: String,
  val publishedAt: String,
  val minimumSupportedVersion: Long,
  val mandatory: Boolean,
  val releaseNotes: List<String>,
)

enum class NativeUpdateStatus { Available, Current, Error }

data class NativeUpdateCheck(
  val status: NativeUpdateStatus,
  val manifest: NativeUpdateManifest? = null,
  val message: String = "",
)

class NativeUpdateValidationException(message: String) : IllegalArgumentException(message)

/**
 * Native updater for the official StreamFree release channel.
 *
 * The manifest URL is selected by the app, never by JavaScript or a web page.
 * APKs are written to a private cache directory and are deleted on every
 * verification failure before an installer intent can be created.
 */
class NativeUpdateClient(
  private val packageId: String,
  private val currentVersionCode: Long,
  private val expectedSigningCertificateSha256: String,
  private val manifestFileName: String,
  private val transport: StreamFreeHttpTransport = StreamFreeHttpClient(DOWNLOAD_POLICY),
  private val json: Json = Json { ignoreUnknownKeys = true },
) {
  init {
    require(packageId.matches(PACKAGE_ID_PATTERN)) { "Invalid package ID" }
    require(expectedSigningCertificateSha256.matches(FINGERPRINT_PATTERN)) { "Invalid signing certificate" }
    require(manifestFileName.matches(MANIFEST_FILE_PATTERN)) { "Invalid manifest filename" }
    require(currentVersionCode >= 1L) { "Current version code must be positive" }
  }

  suspend fun check(): NativeUpdateCheck = withContext(Dispatchers.IO) {
    runCatching {
      val response = transport.get(
        "$OFFICIAL_ORIGIN/downloads/$manifestFileName",
        mapOf("Accept" to "application/json"),
      )
      if (response.statusCode !in 200..299) {
        throw NativeUpdateValidationException("The official update manifest is unavailable")
      }
      if (response.body.size > MAX_MANIFEST_BYTES) {
        throw NativeUpdateValidationException("The update manifest is too large")
      }
      val manifest = NativeUpdateManifestValidator.parse(
        text = response.text,
        expectedPackageId = packageId,
        expectedCertificateSha256 = expectedSigningCertificateSha256,
      )
      NativeUpdateCheck(
        status = if (manifest.versionCode > currentVersionCode) NativeUpdateStatus.Available else NativeUpdateStatus.Current,
        manifest = manifest,
        message = if (manifest.versionCode > currentVersionCode) {
          "Version ${manifest.versionName} is ready to install."
        } else {
          "You are using the latest compatible version."
        },
      )
    }.getOrElse { error ->
      NativeUpdateCheck(
        status = NativeUpdateStatus.Error,
        message = error.message ?: "Update check failed",
      )
    }
  }

  suspend fun downloadAndVerify(context: Context, manifest: NativeUpdateManifest): File = withContext(Dispatchers.IO) {
    if (manifest.packageId != packageId || manifest.versionCode <= currentVersionCode) {
      throw NativeUpdateValidationException("This update is not newer than the installed app")
    }
    if (!manifest.signingCertificateSha256.equals(expectedSigningCertificateSha256, ignoreCase = true)) {
      throw NativeUpdateValidationException("The update signing identity is not trusted")
    }

    val updateDirectory = context.cacheDir.resolve(UPDATE_DIRECTORY_NAME).apply {
      if (!exists() && !mkdirs()) throw NativeUpdateValidationException("Unable to prepare update storage")
    }
    val temporaryFile = File.createTempFile("streamfree-update-", ".apk.part", updateDirectory)
    var finalFile: File? = null
    try {
      val response = transport.get(
        manifest.apkUrl,
        mapOf("Accept" to "application/vnd.android.package-archive"),
      )
      if (response.statusCode !in 200..299) {
        throw NativeUpdateValidationException("The APK download failed")
      }
      if (response.body.size.toLong() != manifest.sizeBytes) {
        throw NativeUpdateValidationException("The APK size does not match the manifest")
      }
      if (!sha256(response.body).equals(manifest.sha256, ignoreCase = true)) {
        throw NativeUpdateValidationException("The APK checksum does not match the manifest")
      }
      FileOutputStream(temporaryFile).use { it.write(response.body) }
      val targetFile = updateDirectory.resolve("StreamFree-${manifest.versionName}.apk")
      finalFile = targetFile
      if (targetFile.exists() && !targetFile.delete()) {
        throw NativeUpdateValidationException("Unable to replace the cached APK")
      }
      if (!temporaryFile.renameTo(targetFile)) {
        throw NativeUpdateValidationException("Unable to finalize the APK download")
      }
      UpdateApkVerifier.verify(context, targetFile, manifest, currentVersionCode)
      targetFile
    } catch (error: Throwable) {
      temporaryFile.delete()
      finalFile?.delete()
      throw error
    }
  }

  companion object {
    const val OFFICIAL_ORIGIN = "https://streamfree.online"
    const val PHONE_MANIFEST = "streamfree-android.json"
    const val TV_MANIFEST = "streamfree-android-tv.json"
    private const val UPDATE_DIRECTORY_NAME = "streamfree-updates"
    private const val MAX_MANIFEST_BYTES = 128 * 1024
    private val PACKAGE_ID_PATTERN = Regex("[a-z][a-z0-9_]*(?:\\.[a-z][a-z0-9_]*)+")
    private val MANIFEST_FILE_PATTERN = Regex("streamfree-android(?:-tv)?\\.json")
    private val FINGERPRINT_PATTERN = Regex("[A-Fa-f0-9]{64}")
    private val DOWNLOAD_POLICY = SafeUrlPolicy(
      allowedHosts = setOf("streamfree.online"),
      allowSubdomains = false,
      maxRedirects = 2,
      maxResponseBytes = 100L * 1024L * 1024L,
    )
  }
}

object NativeUpdateManifestValidator {
  private val FINGERPRINT_PATTERN = Regex("[A-Fa-f0-9]{64}")
  private val VERSION_NAME_PATTERN = Regex("[A-Za-z0-9][A-Za-z0-9.+_-]{0,63}")
  private val SHA256_PATTERN = Regex("[A-Fa-f0-9]{64}")
  private const val OFFICIAL_HOST = "streamfree.online"
  private const val MAX_APK_BYTES = 100L * 1024L * 1024L

  fun parse(
    text: String,
    expectedPackageId: String,
    expectedCertificateSha256: String,
  ): NativeUpdateManifest {
    val root = runCatching { Json.parseToJsonElement(text).jsonObject }
      .getOrElse { throw NativeUpdateValidationException("The update manifest is not valid JSON") }
    val schemaVersion = root.requiredInt("schemaVersion")
    val packageId = root.requiredString("packageId")
    val versionName = root.requiredString("versionName")
    val versionCode = root.requiredLong("versionCode")
    val apkUrl = root.requiredString("apkUrl")
    val sha256 = root.requiredString("sha256").uppercase()
    val sizeBytes = root.requiredLong("sizeBytes")
    val certificate = root.requiredString("signingCertificateSha256").uppercase()
    val publishedAt = root.requiredString("publishedAt")
    val minimumSupportedVersion = root.requiredLong("minimumSupportedVersion")
    val mandatory = root.requiredBoolean("mandatory")

    if (schemaVersion != 1) fail("Unsupported update manifest schema")
    if (packageId != expectedPackageId) fail("Update package ID does not match this app")
    if (!versionName.matches(VERSION_NAME_PATTERN)) fail("Invalid update version name")
    if (versionCode < 1L) fail("Invalid update version code")
    if (!sha256.matches(SHA256_PATTERN)) fail("Invalid APK checksum")
    if (sizeBytes !in 1L..MAX_APK_BYTES) fail("Invalid APK size")
    if (!certificate.matches(FINGERPRINT_PATTERN) || !certificate.equals(expectedCertificateSha256, ignoreCase = true)) {
      fail("Update signing certificate is not trusted")
    }
    if (publishedAt.isBlank() || minimumSupportedVersion < 1L || minimumSupportedVersion > versionCode) {
      fail("Invalid update metadata")
    }
    val normalizedApkUrl = validateApkUrl(apkUrl)
    val releaseNotes = root["releaseNotes"]?.let { notes ->
      if (!notes.isJsonArray) fail("Invalid release notes")
      notes.jsonArray.map { note ->
        val value = note.jsonPrimitive.contentOrNull ?: fail("Invalid release note")
        if (value.length !in 1..500) fail("Invalid release note length")
        value
      }.takeIf { it.size <= 20 } ?: fail("Too many release notes")
    }.orEmpty()

    return NativeUpdateManifest(
      schemaVersion = schemaVersion,
      packageId = packageId,
      versionName = versionName,
      versionCode = versionCode,
      apkUrl = normalizedApkUrl,
      sha256 = sha256,
      sizeBytes = sizeBytes,
      signingCertificateSha256 = certificate,
      publishedAt = publishedAt,
      minimumSupportedVersion = minimumSupportedVersion,
      mandatory = mandatory,
      releaseNotes = releaseNotes,
    )
  }

  private fun validateApkUrl(rawUrl: String): String {
    val base = "https://$OFFICIAL_HOST/downloads/manifest.json".toHttpUrlOrNull()
      ?: fail("Invalid official update origin")
    val url = base.resolve(rawUrl) ?: fail("Invalid APK URL")
    if (url.scheme != "https" || url.host != OFFICIAL_HOST || url.port != 443 || url.username.isNotEmpty() || url.password.isNotEmpty()) {
      fail("APK URL is not an official HTTPS URL")
    }
    if (url.query != null || url.fragment != null || !url.encodedPath.startsWith("/downloads/")) {
      fail("APK URL path is not approved")
    }
    if (url.encodedPath.contains("..") || !url.encodedPath.endsWith(".apk")) {
      fail("APK URL filename is not approved")
    }
    return url.toString()
  }

  private fun JsonObject.requiredString(key: String): String = this[key]?.jsonPrimitive?.contentOrNull
    ?.takeIf { it.isNotBlank() } ?: fail("Missing $key")

  private fun JsonObject.requiredInt(key: String): Int = this[key]?.jsonPrimitive?.intOrNull
    ?: fail("Missing $key")

  private fun JsonObject.requiredLong(key: String): Long = this[key]?.jsonPrimitive?.longOrNull
    ?: fail("Missing $key")

  private fun JsonObject.requiredBoolean(key: String): Boolean = this[key]?.jsonPrimitive?.booleanOrNull
    ?: fail("Missing $key")

  private fun fail(message: String): Nothing = throw NativeUpdateValidationException(message)
}

object UpdateApkVerifier {
  data class Identity(val packageId: String, val versionCode: Long, val certificateSha256: String)

  fun verify(
    context: Context,
    apkFile: File,
    manifest: NativeUpdateManifest,
    currentVersionCode: Long,
  ): Identity {
    if (!apkFile.isFile || apkFile.length() != manifest.sizeBytes) {
      fail("Downloaded APK is incomplete")
    }
    val packageInfo = readPackageInfo(context.packageManager, apkFile)
      ?: fail("Android could not parse the downloaded APK")
    val packageName = packageInfo.packageName
    val versionCode = packageInfo.longVersionCode
    if (packageName != manifest.packageId || packageName != context.packageName) {
      fail("Downloaded APK package ID is not trusted")
    }
    if (versionCode != manifest.versionCode || versionCode <= currentVersionCode) {
      fail("Downloaded APK version code is not trusted")
    }
    val certificate = certificateSha256(packageInfo)
    if (!certificate.equals(manifest.signingCertificateSha256, ignoreCase = true)) {
      fail("Downloaded APK certificate is not trusted")
    }
    return Identity(packageName, versionCode, certificate)
  }

  private fun readPackageInfo(packageManager: PackageManager, apkFile: File): PackageInfo? = if (Build.VERSION.SDK_INT >= 33) {
    packageManager.getPackageArchiveInfo(
      apkFile.absolutePath,
      PackageManager.PackageInfoFlags.of(PackageManager.GET_SIGNING_CERTIFICATES.toLong()),
    )
  } else {
    @Suppress("DEPRECATION")
    packageManager.getPackageArchiveInfo(apkFile.absolutePath, PackageManager.GET_SIGNATURES)
  }

  private fun certificateSha256(packageInfo: PackageInfo): String {
    val signatures = if (Build.VERSION.SDK_INT >= 28) {
      val signingInfo = packageInfo.signingInfo ?: fail("Downloaded APK has no signing information")
      if (signingInfo.hasMultipleSigners()) signingInfo.apkContentsSigners else signingInfo.signingCertificateHistory
    } else {
      @Suppress("DEPRECATION")
      packageInfo.signatures ?: emptyArray()
    }
    val certificate = signatures.firstOrNull() ?: fail("Downloaded APK has no certificate")
    val x509 = CertificateFactory.getInstance("X.509")
      .generateCertificate(ByteArrayInputStream(certificate.toByteArray()))
    return MessageDigest.getInstance("SHA-256").digest(x509.encoded).toHex()
  }

  private fun ByteArray.toHex(): String = joinToString("") { "%02X".format(it) }

  private fun fail(message: String): Nothing = throw NativeUpdateValidationException(message)
}

private fun sha256(bytes: ByteArray): String = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02X".format(it) }

private val JsonElement.isJsonArray: Boolean get() = this is kotlinx.serialization.json.JsonArray
