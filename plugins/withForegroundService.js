const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withForegroundService(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }

    const addPermission = (name) => {
      if (!manifest["uses-permission"].some((p) => p.$["android:name"] === name)) {
        manifest["uses-permission"].push({ $: { "android:name": name } });
      }
    };

    addPermission("android.permission.FOREGROUND_SERVICE");
    addPermission("android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK");
    addPermission("android.permission.WAKE_LOCK");

    const app = manifest.application?.[0];
    if (!app) {
      console.warn("[withForegroundService] AndroidManifest missing <application> node");
      return config;
    }

    if (!app.service) {
      app.service = [];
    }

    const serviceName = "com.soundpulseapp.android.ForegroundAudioService";
    const serviceAttrs = {
      "android:name": serviceName,
      "android:enabled": "true",
      "android:exported": "false",
      "android:foregroundServiceType": "mediaPlayback",
      "android:stopWithTask": "false",
    };

    const existingService = app.service.find((s) => s.$["android:name"] === serviceName);
    if (existingService) {
      existingService.$ = { ...existingService.$, ...serviceAttrs };
    } else {
      app.service.push({ $: serviceAttrs });
    }

    return config;
  });
};
