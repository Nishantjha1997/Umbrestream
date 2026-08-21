[CmdletBinding()]
param(
  [ValidateSet('phone', 'tv', 'both')]
  [string]$Target = 'both',
  [string]$PhoneApkPath = '',
  [string]$TvApkPath = '',
  [string]$OutputRoot = '',
  [string]$PublishedAt = '',
  [switch]$Publish,
  [switch]$ConfirmNativeFreshInstall
)

$ErrorActionPreference = 'Stop'

$nativeRoot = Split-Path -Parent $PSScriptRoot
$repositoryRoot = Split-Path -Parent $nativeRoot
if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
  $OutputRoot = Join-Path $repositoryRoot 'release-staging\native'
}

if ($Publish -and -not $ConfirmNativeFreshInstall) {
  throw 'Publishing native candidates requires -ConfirmNativeFreshInstall because the native signing identity is a fresh-install identity.'
}

if ([string]::IsNullOrWhiteSpace($PublishedAt)) {
  $PublishedAt = [DateTime]::UtcNow.ToString('o')
}
try {
  $publishedDate = [DateTime]::Parse($PublishedAt).ToUniversalTime()
  $PublishedAt = $publishedDate.ToString('o')
} catch {
  throw "PublishedAt is not a valid timestamp: $PublishedAt"
}

function Get-ToolPath {
  param([string]$ToolName)

  $sdkRoot = $env:ANDROID_SDK_ROOT
  if ([string]::IsNullOrWhiteSpace($sdkRoot)) {
    $sdkRoot = $env:ANDROID_HOME
  }
  if ([string]::IsNullOrWhiteSpace($sdkRoot)) {
    throw 'ANDROID_SDK_ROOT or ANDROID_HOME must point to the Android SDK.'
  }

  $tool = Get-ChildItem -LiteralPath (Join-Path $sdkRoot 'build-tools') -Directory |
    Sort-Object Name -Descending |
    ForEach-Object { Join-Path $_.FullName $ToolName } |
    Where-Object { Test-Path -LiteralPath $_ } |
    Select-Object -First 1
  if ([string]::IsNullOrWhiteSpace($tool)) {
    throw "Android SDK build tool was not found: $ToolName"
  }
  return $tool
}

$aapt2 = Get-ToolPath 'aapt2.exe'
$apksigner = Get-ToolPath 'apksigner.bat'
$certificates = Get-Content -LiteralPath (Join-Path $repositoryRoot 'release\signing-certificates.json') -Raw | ConvertFrom-Json

function Resolve-ApkPath {
  param([string]$Value, [string]$DefaultRelativePath, [string]$Label)
  $candidate = if ([string]::IsNullOrWhiteSpace($Value)) {
    Join-Path $nativeRoot $DefaultRelativePath
  } else {
    $Value
  }
  $resolved = [System.IO.Path]::GetFullPath($candidate)
  if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
    throw "$Label APK was not found: $resolved"
  }
  if ([System.IO.Path]::GetExtension($resolved).ToLowerInvariant() -ne '.apk') {
    throw "$Label candidate is not an APK: $resolved"
  }
  return $resolved
}

function Read-ApkIdentity {
  param([string]$ApkPath, [string]$Label)

  $badging = (& $aapt2 dump badging $ApkPath 2>&1 | Out-String)
  if ($LASTEXITCODE -ne 0) {
    throw "$Label APK cannot be parsed by aapt2."
  }
  $packageMatch = [regex]::Match($badging, "package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'")
  if (-not $packageMatch.Success) {
    throw "$Label APK has no parseable package identity."
  }

  $signatureOutput = (& $apksigner verify --verbose --print-certs $ApkPath 2>&1 | Out-String)
  if ($LASTEXITCODE -ne 0 -or $signatureOutput -notmatch 'Verified using v2 scheme \(APK Signature Scheme v2\): true' -or $signatureOutput -notmatch 'Verified using v3 scheme \(APK Signature Scheme v3\): true') {
    throw "$Label APK must verify with APK Signature Scheme v2 and v3."
  }
  $certificateMatch = [regex]::Match($signatureOutput, 'Signer #1 certificate SHA-256 digest:\s*([A-Fa-f0-9]{64})')
  if (-not $certificateMatch.Success) {
    throw "$Label APK has no parseable signing certificate."
  }

  $file = Get-Item -LiteralPath $ApkPath
  $hash = (Get-FileHash -LiteralPath $ApkPath -Algorithm SHA256).Hash.ToUpperInvariant()
  [pscustomobject]@{
    packageId = $packageMatch.Groups[1].Value
    versionCode = [int64]$packageMatch.Groups[2].Value
    versionName = $packageMatch.Groups[3].Value
    certificateSha256 = $certificateMatch.Groups[1].Value.ToUpperInvariant()
    sha256 = $hash
    sizeBytes = [int64]$file.Length
  }
}

function New-Publication {
  param(
    [string]$Label,
    [string]$Platform,
    [string]$ManifestFile,
    [string]$ApkPath,
    [pscustomobject]$LegacyCertificate,
    [pscustomobject]$NativeCertificate
  )

  $identity = Read-ApkIdentity $ApkPath $Label
  if ($identity.packageId -ne $NativeCertificate.packageId) {
    throw "$Label package ID does not match the canonical native package: $($identity.packageId)"
  }
  if ($identity.certificateSha256 -ne $NativeCertificate.certificateSha256.ToUpperInvariant()) {
    throw "$Label signing certificate does not match release/signing-certificates.json nativeFreshInstall.$Label"
  }

  $apkName = if ($Platform -eq 'android') {
    "StreamFree-Android-v$($identity.versionName).apk"
  } else {
    "StreamFree-TV-v$($identity.versionName).apk"
  }
  $manifest = [ordered]@{
    platform = $Platform
    schemaVersion = 1
    packageId = $identity.packageId
    versionName = $identity.versionName
    versionCode = $identity.versionCode
    apkUrl = "/downloads/$apkName"
    sha256 = $identity.sha256
    sizeBytes = $identity.sizeBytes
    signingCertificateSha256 = $identity.certificateSha256
    publishedAt = $PublishedAt
    minimumSupportedVersion = 1
    mandatory = $false
    freshInstallRequired = $true
    migration = [ordered]@{
      mode = 'fresh_install'
      legacyPackageId = $LegacyCertificate.packageId
      legacySigningCertificateSha256 = $LegacyCertificate.certificateSha256
      userAction = 'Sync guest data, uninstall the legacy-signed app, then install this native release.'
    }
    releaseNotes = @(
      'Native Media3 playback with provider-aware headers and trusted progress events.',
      'Persistent Fit/Fill, fullscreen orientation, source selection, and anime Sub/Dub controls.',
      'Gated offline downloads with Wi-Fi-only background transfer for explicitly approved direct sources.',
      'Official-manifest update verification checks package, version, checksum, and signing certificate before install.'
    )
    notes = @(
      'This release uses the native fresh-install signing identity.',
      'Do not install over a legacy-signed package; sync cloud data before migration.',
      'Third-party providers are not automatically enabled for permanent offline storage.'
    )
  }

  $staging = Join-Path $OutputRoot $Label
  New-Item -ItemType Directory -Force -Path $staging | Out-Null
  Copy-Item -LiteralPath $ApkPath -Destination (Join-Path $staging $apkName) -Force
  $manifestPath = Join-Path $staging $ManifestFile
  $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding utf8
  Write-Verbose "$Label staged: $manifestPath"
  return [pscustomobject]@{ ManifestPath = $manifestPath; ApkPath = (Join-Path $staging $apkName) }
}

$results = @()
if ($Target -in @('phone', 'both')) {
  $phoneApk = Resolve-ApkPath $PhoneApkPath 'app-phone\build\outputs\apk\release\app-phone-release.apk' 'Phone'
  $results += New-Publication 'phone' 'android' 'streamfree-android.json' $phoneApk $certificates.phone $certificates.nativeFreshInstall.phone
}
if ($Target -in @('tv', 'both')) {
  $tvApk = Resolve-ApkPath $TvApkPath 'app-tv\build\outputs\apk\release\app-tv-release.apk' 'TV'
  $results += New-Publication 'tv' 'android-tv' 'streamfree-android-tv.json' $tvApk $certificates.tv $certificates.nativeFreshInstall.tv
}

if ($Publish) {
  $downloads = Join-Path $repositoryRoot 'public\downloads'
  foreach ($result in $results) {
    Copy-Item -LiteralPath $result.ApkPath -Destination $downloads -Force
    Copy-Item -LiteralPath $result.ManifestPath -Destination $downloads -Force
  }
  Write-Warning 'Native APKs and manifests were copied into public/downloads. Run the release gates before committing or deploying.'
} else {
  Write-Output "Native publication artifacts are staged under $OutputRoot. Production downloads were not changed."
}
