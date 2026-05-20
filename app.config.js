const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});

const appJson = require("./app.json");

const basePlugins = appJson.expo.plugins || [];
const plugins = Array.from(
  new Set([...basePlugins, "./plugins/withReactNativeSvg"])
);

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    scheme: "soundpulse",
    cli: {
      appVersionSource: "remote",
    },
    android: {
      ...appJson.expo.android,
      package: "com.soundpulseapp.android",
    },
    plugins,
    extra: {
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL,
      appSecretKey: process.env.EXPO_PUBLIC_APP_KEY,
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      eas: {
        projectId: "1ca89701-a6a7-4b1b-97cb-51311f7ed9b9",
      },
    },
  },
};
