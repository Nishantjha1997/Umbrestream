pluginManagement {
  repositories {
    google()
    mavenCentral()
    gradlePluginPortal()
  }
}

dependencyResolutionManagement {
  repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
  repositories {
    google()
    mavenCentral()
  }
}

rootProject.name = "streamfree-native"

include(":app-phone")
include(":app-tv")
include(":core:common")
include(":core:model")
include(":core:designsystem")
include(":core:network")
