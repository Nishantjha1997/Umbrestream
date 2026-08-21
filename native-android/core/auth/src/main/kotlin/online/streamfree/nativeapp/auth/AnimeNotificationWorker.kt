package online.streamfree.nativeapp.auth

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import kotlinx.coroutines.flow.first
import java.security.MessageDigest
import java.util.Calendar
import java.util.concurrent.TimeUnit

object AnimeNotificationDeliveryState {
  fun unseenUnread(
    notifications: List<NativeAnimeNotification>,
    deliveredIds: Set<Long>,
  ): List<NativeAnimeNotification> = notifications
    .filter { it.readAt == null && it.id !in deliveredIds }
    .distinctBy(NativeAnimeNotification::id)
    .sortedByDescending(NativeAnimeNotification::createdAt)
}

private val Context.animeNotificationDataStore by preferencesDataStore(name = "streamfree_anime_notification_state")

data class AnimeNotificationPreferences(
  val enabled: Boolean = true,
  val quietStartMinute: Int = 22 * 60,
  val quietEndMinute: Int = 8 * 60,
) {
  fun allows(minuteOfDay: Int): Boolean = enabled && !AnimeNotificationQuietHours.isQuiet(
    minuteOfDay = minuteOfDay,
    startMinute = quietStartMinute,
    endMinute = quietEndMinute,
  )
}

object AnimeNotificationQuietHours {
  fun isQuiet(minuteOfDay: Int, startMinute: Int, endMinute: Int): Boolean {
    if (minuteOfDay !in 0 until MINUTES_PER_DAY) return false
    if (startMinute !in 0 until MINUTES_PER_DAY || endMinute !in 0 until MINUTES_PER_DAY) return false
    if (startMinute == endMinute) return false
    return if (startMinute < endMinute) {
      minuteOfDay in startMinute until endMinute
    } else {
      minuteOfDay >= startMinute || minuteOfDay < endMinute
    }
  }

  private const val MINUTES_PER_DAY = 24 * 60
}

class AnimeNotificationPreferenceStore(private val context: Context) {
  suspend fun read(): AnimeNotificationPreferences {
    val preferences = context.animeNotificationDataStore.data.first()
    return AnimeNotificationPreferences(
      enabled = preferences[ENABLED].let { value -> value ?: true },
      quietStartMinute = preferences[QUIET_START].let { value -> value ?: 22 * 60 },
      quietEndMinute = preferences[QUIET_END].let { value -> value ?: 8 * 60 },
    )
  }

  suspend fun update(value: AnimeNotificationPreferences) {
    context.animeNotificationDataStore.edit { preferences ->
      preferences[ENABLED] = value.enabled
      preferences[QUIET_START] = value.quietStartMinute
      preferences[QUIET_END] = value.quietEndMinute
    }
  }

  private companion object {
    val ENABLED = booleanPreferencesKey("enabled")
    val QUIET_START = intPreferencesKey("quiet_start_minute")
    val QUIET_END = intPreferencesKey("quiet_end_minute")
  }
}

private class AnimeNotificationDeliveryStore(private val context: Context) {
  suspend fun claim(userKey: String, notifications: List<NativeAnimeNotification>): List<NativeAnimeNotification> {
    val claimed = mutableListOf<NativeAnimeNotification>()
    context.animeNotificationDataStore.edit { preferences ->
      val key = stringPreferencesKey("delivered.${hash(userKey)}")
      val delivered = preferences[key].orEmpty()
        .split(',')
        .mapNotNull(String::toLongOrNull)
        .toMutableSet()
      val unseen = AnimeNotificationDeliveryState.unseenUnread(notifications, delivered)
      claimed += unseen
      delivered += unseen.map(NativeAnimeNotification::id)
      preferences[key] = delivered.toList().takeLast(MAX_DELIVERED_IDS).joinToString(",")
    }
    return claimed
  }

  private fun hash(value: String): String = MessageDigest.getInstance("SHA-256")
    .digest(value.toByteArray(Charsets.UTF_8))
    .joinToString("") { "%02x".format(it) }

  private companion object {
    const val MAX_DELIVERED_IDS = 200
  }
}

class AnimeEpisodeNotificationPublisher(private val context: Context) {
  private val deliveryStore = AnimeNotificationDeliveryStore(context)

  suspend fun publish(
    userKey: String,
    notifications: List<NativeAnimeNotification>,
    minuteOfDay: Int = currentMinuteOfDay(),
  ): Int {
    if (notifications.isEmpty() || !notificationsAllowed()) return 0
    if (!AnimeNotificationPreferenceStore(context).read().allows(minuteOfDay)) return 0
    ensureChannel()
    val claimed = deliveryStore.claim(userKey, notifications)
    val manager = NotificationManagerCompat.from(context)
    claimed.forEach { notification ->
      val builder = NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(android.R.drawable.ic_dialog_info)
        .setContentTitle("New anime episode")
        .setContentText("${notification.title} · Episode ${notification.episode}")
        .setStyle(NotificationCompat.BigTextStyle().bigText("${notification.title} · Episode ${notification.episode}"))
        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
        .setAutoCancel(true)
      runCatching { manager.notify(notification.id.toInt(), builder.build()) }
    }
    return claimed.size
  }

  private fun notificationsAllowed(): Boolean =
    Build.VERSION.SDK_INT < 33 ||
      context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < 26) return
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Anime episode alerts",
      NotificationManager.IMPORTANCE_DEFAULT,
    ).apply {
      description = "New episodes for anime in your StreamFree library"
    }
    context.getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
  }

  private fun currentMinuteOfDay(): Int {
    val calendar = Calendar.getInstance()
    return calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
  }

  private companion object {
    const val CHANNEL_ID = "anime-episodes"
  }
}

object AnimeNotificationScheduler {
  private const val WORK_NAME = "streamfree-anime-notifications"

  fun ensure(context: Context) {
    val request = PeriodicWorkRequestBuilder<AnimeNotificationWorker>(6, TimeUnit.HOURS)
      .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
      .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
      .build()
    WorkManager.getInstance(context.applicationContext)
      .enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request)
  }
}

class AnimeNotificationWorker(
  appContext: Context,
  workerParams: WorkerParameters,
) : CoroutineWorker(appContext, workerParams) {
  override suspend fun doWork(): Result {
    val auth = AuthSessionManager(
      SupabaseAuthClient(),
      EncryptedAuthSessionStore(applicationContext),
    )
    val beforeRefresh = auth.currentSession() ?: return Result.success()
    val token = auth.accessToken() ?: return if (auth.hasSession()) Result.retry() else Result.success()
    val session = auth.currentSession() ?: beforeRefresh
    val notifications = AnimeNotificationClient().load(token) ?: return Result.retry()
    AnimeEpisodeNotificationPublisher(applicationContext).publish(
      userKey = session.userId ?: session.email ?: "signed-in-user",
      notifications = notifications.notifications,
    )
    return Result.success()
  }
}
