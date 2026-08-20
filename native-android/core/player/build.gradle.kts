plugins {
  alias(libs.plugins.android.library)
}

android {
  namespace = "online.streamfree.nativeapp.player"
  compileSdk = libs.versions.compileSdk.get().toInt()

  defaultConfig {
    minSdk = libs.versions.minSdk.get().toInt()
  }

  buildFeatures {
    buildConfig = false
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  lint {
    abortOnError = true
    checkReleaseBuilds = true
    warningsAsErrors = true
  }
}

kotlin {
  jvmToolchain(17)
}

dependencies {
  implementation(project(":core:model"))
  implementation(project(":core:network"))
  implementation(project(":core:source"))
  implementation(libs.androidx.media3.common)
  implementation(libs.androidx.media3.datasource.okhttp)
  implementation(libs.androidx.media3.exoplayer)
  implementation(libs.androidx.media3.exoplayer.hls)
  implementation(libs.androidx.media3.exoplayer.dash)
  testImplementation(libs.junit)
}
