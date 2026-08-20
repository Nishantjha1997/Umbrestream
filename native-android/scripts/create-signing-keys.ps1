[CmdletBinding()]
param(
  [string]$OutputRoot = ''
)

$ErrorActionPreference = 'Stop'

if (-not $env:JAVA_HOME) {
  throw 'JAVA_HOME must point to the JDK used for the release build.'
}

$keytool = Join-Path $env:JAVA_HOME 'bin\keytool.exe'
if (-not (Test-Path -LiteralPath $keytool)) {
  throw "keytool.exe was not found under JAVA_HOME: $env:JAVA_HOME"
}

if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
  $OutputRoot = Join-Path $env:LOCALAPPDATA 'StreamFree\signing'
}

New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null
$phoneKeystore = Join-Path $OutputRoot 'streamfree-native-phone.p12'
$tvKeystore = Join-Path $OutputRoot 'streamfree-native-tv.p12'
$credentialsPath = Join-Path $OutputRoot 'credentials.json'

foreach ($existingPath in @($phoneKeystore, $tvKeystore, $credentialsPath)) {
  if (Test-Path -LiteralPath $existingPath) {
    throw "Refusing to overwrite existing signing material: $existingPath"
  }
}

function New-RandomSecret {
  $bytes = New-Object byte[] 48
  $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $random.GetBytes($bytes)
  } finally {
    $random.Dispose()
  }
  return [Convert]::ToBase64String($bytes)
}

function New-KeyPair {
  param(
    [string]$Keystore,
    [string]$Alias,
    [string]$Password,
    [string]$DistinguishedName
  )

  $arguments = @(
    '-genkeypair',
    '-noprompt',
    '-storetype', 'PKCS12',
    '-keystore', $Keystore,
    '-storepass', $Password,
    '-keypass', $Password,
    '-alias', $Alias,
    '-keyalg', 'RSA',
    '-keysize', '4096',
    '-validity', '10000',
    '-dname', $DistinguishedName
  )

  & $keytool @arguments *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "keytool failed while creating $Keystore"
  }
}

function Get-CertificateFingerprint {
  param(
    [string]$Keystore,
    [string]$Alias,
    [string]$Password
  )

  $arguments = @(
    '-list',
    '-v',
    '-storetype', 'PKCS12',
    '-keystore', $Keystore,
    '-storepass', $Password,
    '-alias', $Alias
  )
  $details = & $keytool @arguments 2>$null
  if ($LASTEXITCODE -ne 0) {
    throw "keytool failed while reading $Keystore"
  }

  $line = ($details | Select-String -Pattern '^\s*SHA256:' | Select-Object -First 1).ToString()
  if ([string]::IsNullOrWhiteSpace($line)) {
    throw "No SHA-256 certificate fingerprint was returned for $Keystore"
  }
  return (($line -replace '^\s*SHA256:\s*', '') -replace ':', '').ToUpperInvariant()
}

$phonePassword = New-RandomSecret
$tvPassword = New-RandomSecret
$phoneAlias = 'streamfree-native-phone'
$tvAlias = 'streamfree-native-tv'

New-KeyPair `
  -Keystore $phoneKeystore `
  -Alias $phoneAlias `
  -Password $phonePassword `
  -DistinguishedName 'CN=StreamFree Native Phone, OU=Android, O=StreamFree, L=India, ST=NA, C=IN'

New-KeyPair `
  -Keystore $tvKeystore `
  -Alias $tvAlias `
  -Password $tvPassword `
  -DistinguishedName 'CN=StreamFree Native TV, OU=Android TV, O=StreamFree, L=India, ST=NA, C=IN'

$phoneFingerprint = Get-CertificateFingerprint $phoneKeystore $phoneAlias $phonePassword
$tvFingerprint = Get-CertificateFingerprint $tvKeystore $tvAlias $tvPassword

$credentials = [ordered]@{
  schemaVersion = 1
  warning = 'DPAPI-protected for this Windows user; never commit or share this file.'
  phone = [ordered]@{
    keystorePath = $phoneKeystore
    keyAlias = $phoneAlias
    storePasswordDpapi = (ConvertTo-SecureString $phonePassword -AsPlainText -Force | ConvertFrom-SecureString)
    keyPasswordDpapi = (ConvertTo-SecureString $phonePassword -AsPlainText -Force | ConvertFrom-SecureString)
  }
  tv = [ordered]@{
    keystorePath = $tvKeystore
    keyAlias = $tvAlias
    storePasswordDpapi = (ConvertTo-SecureString $tvPassword -AsPlainText -Force | ConvertFrom-SecureString)
    keyPasswordDpapi = (ConvertTo-SecureString $tvPassword -AsPlainText -Force | ConvertFrom-SecureString)
  }
}

$credentials | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $credentialsPath -Encoding UTF8

Write-Output "Native phone certificate SHA-256: $phoneFingerprint"
Write-Output "Native TV certificate SHA-256: $tvFingerprint"
Write-Output "Private keys and DPAPI credentials were created outside Git at: $OutputRoot"
Write-Output 'Copy only the public fingerprints into release/signing-certificates.json.'
