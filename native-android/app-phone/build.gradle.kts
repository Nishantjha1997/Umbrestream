plugins {
  alias(libs.plugins.android.application)
  alias(libs.plugins.compose.compiler)
}

android {
  namespace = "online.streamfree.nativeapp.phone"
  compileSdk = libs.versions.compileSdk.get().toInt()

  defaultConfig {
    // The canonical package is deliberately retained for the future signed
    // native cutover. This scaffold is never published as a release artifact.
    applicationId = "online.streamfree.app"
    minSdk = libs.versions.minSdk.get().toInt()
    targetSdk = libs.versions.targetSdk.get().toInt()
    versionCode = providers.gradleProperty("streamfree.phone.versionCode").orNull?.toIntOrNull() ?: 9
    versionName = providers.gradleProperty("streamfree.phone.versionName").orNull ?: "1.4.0-dev"
    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
  }

  buildFeatures {
    compose = true
    buildConfig = true
  }

  val releaseSigningConfigured = listOf(
    "STREAMFREE_NATIVE_PHONE_KEYSTORE",
    "STREAMFREE_NATIVE_PHONE_STORE_PASSWORD",
    "STREAMFREE_NATIVE_PHONE_KEY_ALIAS",
    "STREAMFREE_NATIVE_PHONE_KEY_PASSWORD",
  ).all { providers.environmentVariable(it).isPresent }

  if (releaseSigningConfigured) {
    signingConfigs {
      create("streamFreeRelease") {
        storeFile = file(providers.environmentVariable("STREAMFREE_NATIVE_PHONE_KEYSTORE").get())
        storePassword = providers.environmentVariable("STREAMFREE_NATIVE_PHONE_STORE_PASSWORD").get()
        keyAlias = providers.environmentVariable("STREAMFREE_NATIVE_PHONE_KEY_ALIAS").get()
        keyPassword = providers.environmentVariable("STREAMFREE_NATIVE_PHONE_KEY_PASSWORD").get()
        enableV1Signing = true
        enableV2Signing = true
        enableV3Signing = true
      }
    }
  }

  buildTypes {
    debug {
      applicationIdSuffix = ".debug"
      versionNameSuffix = "-debug"
    }
    release {
      isMinifyEnabled = true
      isShrinkResources = true
      isDebuggable = false
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
      if (releaseSigningConfigured) {
        signingConfig = signingConfigs.getByName("streamFreeRelease")
      }
    }
  }

  gradle.taskGraph.whenReady {
    if (allTasks.any { it.path.startsWith(":app-phone:") && it.name.contains("Release") } && !releaseSigningConfigured) {
      throw GradleException("Native phone release signing is missing; configure STREAMFREE_NATIVE_* environment variables.")
    }
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
  implementation(project(":core:common"))
  implementation(project(":core:model"))
  implementation(project(":core:designsystem"))
  implementation(libs.androidx.core.ktx)
  implementation(libs.androidx.activity.compose)
  implementation(libs.androidx.lifecycle.runtime.ktx)
  implementation(platform(libs.androidx.compose.bom))
  implementation(libs.androidx.compose.ui)
  implementation(libs.androidx.compose.material3)
  implementation(libs.androidx.compose.ui.tooling.preview)
  debugImplementation(libs.androidx.compose.ui.tooling)
  androidTestImplementation(platform(libs.androidx.compose.bom))
  androidTestImplementation(libs.androidx.compose.ui.test.junit4)
  androidTestImplementation(libs.androidx.junit)
  androidTestImplementation(libs.androidx.espresso.core)
}
