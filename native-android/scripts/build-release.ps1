[CmdletBinding()]
param(
  [ValidateSet('phone', 'tv', 'both')]
  [string]$Target = 'both',
  [string]$SigningRoot = '',
  [string]$PhoneVersionName = '1.4.2-native',
  [int]$PhoneVersionCode = 12,
  [string]$TvVersionName = '1.3.2-native',
  [int]$TvVersionCode = 10
)

$ErrorActionPreference = 'Stop'

if (-not $env:JAVA_HOME) {
  throw 'JAVA_HOME must point to the JDK used for the release build.'
}

if ([string]::IsNullOrWhiteSpace($SigningRoot)) {
  $SigningRoot = Join-Path $env:LOCALAPPDATA 'StreamFree\signing'
}

$credentialsPath = Join-Path $SigningRoot 'credentials.json'
if (-not (Test-Path -LiteralPath $credentialsPath)) {
  throw "Signing credentials were not found at $credentialsPath. Run create-signing-keys.ps1 once."
}

$credentials = Get-Content -LiteralPath $credentialsPath -Raw | ConvertFrom-Json

function Get-PlainText {
  param([string]$EncryptedValue)
  $secure = ConvertTo-SecureString $EncryptedValue
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

function Set-SigningEnvironment {
  param(
    [string]$Platform,
    [string]$KeystoreVariable,
    [string]$AliasVariable,
    [string]$StorePasswordVariable,
    [string]$KeyPasswordVariable
  )

  $entry = $credentials.$Platform
  Set-Item -Path "Env:$KeystoreVariable" -Value $entry.keystorePath
  Set-Item -Path "Env:$AliasVariable" -Value $entry.keyAlias
  Set-Item -Path "Env:$StorePasswordVariable" -Value (Get-PlainText $entry.storePasswordDpapi)
  Set-Item -Path "Env:$KeyPasswordVariable" -Value (Get-PlainText $entry.keyPasswordDpapi)
}

$tasks = @()
$properties = @()
if ($Target -in @('phone', 'both')) {
  Set-SigningEnvironment 'phone' 'STREAMFREE_NATIVE_PHONE_KEYSTORE' 'STREAMFREE_NATIVE_PHONE_KEY_ALIAS' 'STREAMFREE_NATIVE_PHONE_STORE_PASSWORD' 'STREAMFREE_NATIVE_PHONE_KEY_PASSWORD'
  $tasks += ':app-phone:assembleRelease'
  $properties += "-Pstreamfree.phone.versionName=$PhoneVersionName"
  $properties += "-Pstreamfree.phone.versionCode=$PhoneVersionCode"
}
if ($Target -in @('tv', 'both')) {
  Set-SigningEnvironment 'tv' 'STREAMFREE_NATIVE_TV_KEYSTORE' 'STREAMFREE_NATIVE_TV_KEY_ALIAS' 'STREAMFREE_NATIVE_TV_STORE_PASSWORD' 'STREAMFREE_NATIVE_TV_KEY_PASSWORD'
  $tasks += ':app-tv:assembleRelease'
  $properties += "-Pstreamfree.tv.versionName=$TvVersionName"
  $properties += "-Pstreamfree.tv.versionCode=$TvVersionCode"
}

$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
  & '.\gradlew.bat' @tasks @properties
  if ($LASTEXITCODE -ne 0) {
    throw "Native release build failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
