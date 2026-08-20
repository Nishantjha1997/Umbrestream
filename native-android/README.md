# StreamFree native Android

This is the clean Kotlin/Jetpack Compose replacement project. It lives beside
the legacy Capacitor phone (`../android`) and TV (`../android-tv`) wrappers
until migration, signing, updater, and device-release gates pass.

## Modules currently present

- `app-phone` keeps `online.streamfree.app` for the future native cutover.
- `app-tv` keeps `online.streamfree.tv` for the future native TV cutover.
- `core:common`, `core:model`, and `core:designsystem` hold platform-neutral
  contract, ownership, and presentation foundations.
- `core:network` owns HTTPS-only transport, approved-host validation, safe DNS,
  bounded redirects/responses, app-owned headers, and typed failures.
- `core:source` owns normalized playback requests, provider capabilities,
  resolver selection, header-policy registration, and Sub/Dub separation.
- `core:player` owns the Media3 HLS/DASH/progressive media-source pipeline,
  per-source allowlisted headers, safe DNS, validated redirects, the
  `MediaSession`-backed playback controller, trusted playback state, and
  versioned local progress persistence. Iframe embeds are intentionally
  outside this native pipeline.

No native scaffold APK is a publishable release. Signing, migration data,
native player ownership, and release assembly are added in later tracked tasks.

## Build prerequisites

The project pins Android Gradle Plugin 9.3.1 and Gradle 9.7.1. Install these
public toolchain inputs outside the repository:

- JDK 17.
- Android SDK command-line tools.
- Android SDK Platform 37 (`platforms;android-37.0`).
- Android SDK Build Tools 36.0.0.

Set `JAVA_HOME` and either `ANDROID_SDK_ROOT` or `ANDROID_HOME`, then run the
tracked wrapper. The wrapper JAR and Gradle distribution checksums are pinned;
no machine-local SDK path or private credential belongs in Git.

```powershell
.\scripts\verify.ps1
```

The equivalent direct command is:

```powershell
.\gradlew.bat :core:model:test :app-phone:assembleDebug :app-tv:assembleDebug :app-phone:lintDebug :app-tv:lintDebug :core:designsystem:lintDebug
```

These are development validation APKs only. They use `.debug` application ID
suffixes and must never be copied to website downloads. Release signing and
canonical upgrade checks are owned by `SF-A0-002` and later release gates.

The project intentionally has no keystore, passwords, or signing values in
source control. The tracked public certificate fingerprints remain in
`../release/signing-certificates.json`.

## Native signing

The published Capacitor certificate fingerprints remain under `phone` and
`tv`. Because their private keys were not recoverable in this workspace, the
native cutover uses separate fresh-install keys recorded under
`nativeFreshInstall`. Generate them once on the release machine:

```powershell
.\scripts\create-signing-keys.ps1
```

This stores PKCS#12 private keys and Windows-DPAPI-protected credentials under
`%LOCALAPPDATA%\StreamFree\signing`, outside Git. It refuses to overwrite
existing material. Build a signed native candidate with:

```powershell
.\scripts\build-release.ps1 -Target both
```

The native APKs intentionally keep the canonical application IDs but are not
in-place updates for APKs signed by the legacy certificate. The release page
must tell users to uninstall the old canonical install (after cloud sync) or
use the documented migration path before installing a native candidate.
