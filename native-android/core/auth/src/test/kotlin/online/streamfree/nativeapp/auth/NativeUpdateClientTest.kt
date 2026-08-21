package online.streamfree.nativeapp.auth

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class NativeUpdateClientTest {
  @Test
  fun parsesOfficialManifestAndNormalizesRelativeApkUrl() {
    val manifest = NativeUpdateManifestValidator.parse(
      validManifest(),
      expectedPackageId = PACKAGE,
      expectedCertificateSha256 = CERTIFICATE,
    )

    assertEquals(12L, manifest.versionCode)
    assertEquals("https://streamfree.online/downloads/StreamFree-Android-v1.5.0.apk", manifest.apkUrl)
    assertEquals(listOf("Player fixes", "Safer updates"), manifest.releaseNotes)
  }

  @Test
  fun rejectsUntrustedHostAndCertificate() {
    assertThrows(NativeUpdateValidationException::class.java) {
      NativeUpdateManifestValidator.parse(
        validManifest(apkUrl = "https://evil.example/StreamFree.apk"),
        PACKAGE,
        CERTIFICATE,
      )
    }
    assertThrows(NativeUpdateValidationException::class.java) {
      NativeUpdateManifestValidator.parse(validManifest(certificate = "B".repeat(64)), PACKAGE, CERTIFICATE)
    }
  }

  @Test
  fun rejectsMalformedMetadataAndTraversal() {
    assertThrows(NativeUpdateValidationException::class.java) {
      NativeUpdateManifestValidator.parse(validManifest(sizeBytes = 0), PACKAGE, CERTIFICATE)
    }
    assertThrows(NativeUpdateValidationException::class.java) {
      NativeUpdateManifestValidator.parse(validManifest(apkUrl = "/downloads/../bad.apk"), PACKAGE, CERTIFICATE)
    }
  }

  private fun validManifest(
    apkUrl: String = "/downloads/StreamFree-Android-v1.5.0.apk",
    certificate: String = CERTIFICATE,
    sizeBytes: Long = 1234,
  ): String = """
    {
      "schemaVersion":1,
      "packageId":"$PACKAGE",
      "versionName":"1.5.0",
      "versionCode":12,
      "apkUrl":"$apkUrl",
      "sha256":"${"A".repeat(64)}",
      "sizeBytes":$sizeBytes,
      "signingCertificateSha256":"$certificate",
      "publishedAt":"2026-08-21T00:00:00.000Z",
      "minimumSupportedVersion":1,
      "mandatory":false,
      "releaseNotes":["Player fixes","Safer updates"]
    }
    """.trimIndent()

  private companion object {
    const val PACKAGE = "online.streamfree.app"
    val CERTIFICATE = "A".repeat(64)
  }
}
