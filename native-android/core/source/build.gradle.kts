plugins {
  alias(libs.plugins.kotlin.jvm)
}

kotlin {
  jvmToolchain(17)
}

dependencies {
  implementation(project(":core:model"))
  implementation(project(":core:network"))
  implementation(libs.okhttp)
  implementation(libs.kotlinx.coroutines.core)
  implementation(libs.kotlinx.serialization.json)
  testImplementation(libs.junit)
}
