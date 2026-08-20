[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

if (-not $env:JAVA_HOME) {
  throw 'JAVA_HOME must point to a JDK 17 installation.'
}

$javaExecutable = Join-Path $env:JAVA_HOME 'bin\java.exe'
if (-not (Test-Path -LiteralPath $javaExecutable)) {
  throw "JAVA_HOME does not contain bin\\java.exe: $env:JAVA_HOME"
}

$javaVersion = & $javaExecutable -version 2>&1
if ($LASTEXITCODE -ne 0 -or $javaVersion[0] -notmatch 'version "17[\.]') {
  throw "StreamFree native Android requires JDK 17. Detected: $($javaVersion -join ' ')"
}

$sdkRoot = if ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { $env:ANDROID_HOME }
if (-not $sdkRoot) {
  throw 'Set ANDROID_SDK_ROOT or ANDROID_HOME to the Android SDK directory.'
}

$requiredSdkFiles = @(
  (Join-Path $sdkRoot 'platforms\android-37.0\android.jar'),
  (Join-Path $sdkRoot 'build-tools\36.0.0\aapt2.exe')
)

foreach ($requiredFile in $requiredSdkFiles) {
  if (-not (Test-Path -LiteralPath $requiredFile)) {
    throw "Required Android SDK component is missing: $requiredFile"
  }
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$wrapper = Join-Path $projectRoot 'gradlew.bat'
if (-not (Test-Path -LiteralPath $wrapper)) {
  throw "Tracked Gradle wrapper is missing: $wrapper"
}

Push-Location $projectRoot
try {
  & $wrapper `
    :core:model:test `
    :app-phone:assembleDebug `
    :app-tv:assembleDebug `
    :app-phone:lintDebug `
    :app-tv:lintDebug `
    :core:designsystem:lintDebug
  if ($LASTEXITCODE -ne 0) {
    throw "Native Android verification failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
