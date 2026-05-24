package com.soundpulseapp.foregroundservice

import android.content.Intent
import com.soundpulseapp.android.ForegroundAudioService
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PulseAudioModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PulseAudio")

    Function("startPlayback") { title: String, subtitle: String ->
      val context = appContext.reactContext ?: return@Function null
      val intent = Intent(context, ForegroundAudioService::class.java).apply {
        action = ForegroundAudioService.ACTION_START_PLAYBACK
        putExtra(ForegroundAudioService.EXTRA_TITLE, title)
        putExtra(ForegroundAudioService.EXTRA_SUBTITLE, subtitle)
      }
      context.startForegroundService(intent)
      null
    }

    Function("stopPlayback") {
      val context = appContext.reactContext ?: return@Function null
      val intent = Intent(context, ForegroundAudioService::class.java).apply {
        action = ForegroundAudioService.ACTION_STOP_PLAYBACK
      }
      context.startService(intent)
      null
    }

    /** StudyPulse-compatible alias used by shared playback helpers. */
    Function("startMusic") { title: String, artist: String, _url: String, _durationMs: Double, _queueJson: String? ->
      val context = appContext.reactContext ?: return@Function null
      val intent = Intent(context, ForegroundAudioService::class.java).apply {
        action = ForegroundAudioService.ACTION_START_PLAYBACK
        putExtra(ForegroundAudioService.EXTRA_TITLE, title)
        putExtra(ForegroundAudioService.EXTRA_SUBTITLE, artist)
      }
      context.startForegroundService(intent)
      null
    }

    Function("stopMusic") {
      val context = appContext.reactContext ?: return@Function null
      val intent = Intent(context, ForegroundAudioService::class.java).apply {
        action = ForegroundAudioService.ACTION_STOP_PLAYBACK
      }
      context.startService(intent)
      null
    }
  }
}
