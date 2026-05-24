package com.soundpulseapp.android

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat

/**
 * Keeps SoundPulse alive during expo-av playback with a media-playback foreground notification.
 * Actual audio is rendered in JavaScript; this service holds the wake lock + notification.
 */
class ForegroundAudioService : Service() {

  companion object {
    const val CHANNEL_ID = "soundpulse_playback"
    const val NOTIFICATION_ID = 2001

    const val ACTION_START_PLAYBACK = "com.soundpulseapp.START_PLAYBACK"
    const val ACTION_STOP_PLAYBACK = "com.soundpulseapp.STOP_PLAYBACK"

    const val EXTRA_TITLE = "title"
    const val EXTRA_SUBTITLE = "subtitle"
  }

  private var playbackWakeLock: PowerManager.WakeLock? = null
  private var isPlaybackActive = false
  private var currentTitle = "SoundPulse"
  private var currentSubtitle = "Playing"

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_START_PLAYBACK -> {
        currentTitle = intent.getStringExtra(EXTRA_TITLE)?.takeIf { it.isNotBlank() } ?: "SoundPulse"
        currentSubtitle = intent.getStringExtra(EXTRA_SUBTITLE)?.takeIf { it.isNotBlank() } ?: "Playing"
        isPlaybackActive = true
        startPlaybackForeground()
      }
      ACTION_STOP_PLAYBACK -> {
        stopPlaybackForeground()
      }
    }
    return START_STICKY
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val channel = NotificationChannel(
      CHANNEL_ID,
      "SoundPulse playback",
      NotificationManager.IMPORTANCE_LOW
    ).apply {
      description = "Shows while SoundPulse audio is playing in the background"
      setShowBadge(false)
    }
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.createNotificationChannel(channel)
  }

  private fun buildNotification(): Notification {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
    val pendingIntent = PendingIntent.getActivity(
      this,
      0,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(currentTitle)
      .setContentText(currentSubtitle)
      .setSmallIcon(applicationInfo.icon)
      .setContentIntent(pendingIntent)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .build()
  }

  private fun acquireWakeLock() {
    if (playbackWakeLock?.isHeld == true) {
      return
    }
    val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
    playbackWakeLock = powerManager.newWakeLock(
      PowerManager.PARTIAL_WAKE_LOCK,
      "SoundPulse:PlaybackWakeLock"
    )
    playbackWakeLock?.acquire()
  }

  private fun releaseWakeLock() {
    playbackWakeLock?.let {
      if (it.isHeld) {
        it.release()
      }
    }
    playbackWakeLock = null
  }

  private fun startPlaybackForeground() {
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
    acquireWakeLock()
  }

  private fun stopPlaybackForeground() {
    isPlaybackActive = false
    releaseWakeLock()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
    stopSelf()
  }

  override fun onDestroy() {
    releaseWakeLock()
    super.onDestroy()
  }
}
