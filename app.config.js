const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});

const appJson = require("./app.json");

const basePlugins = appJson.expo.plugins || [];
const plugins = Array.from(
  new Set([...basePlugins, "expo-web-browser", "./plugins/withReactNativeSvg"])
);

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    icon: "./assets/soundpulse-icon-2048.png",
    scheme: "soundpulse",
    splash: {
      ...appJson.expo.splash,
      image: "./assets/soundpulse-icon-2048.png",
      backgroundColor: "#0A0A1A",
      resizeMode: "contain",
    },
    android: {
      ...appJson.expo.android,
      package: "com.soundpulseapp.android",
      adaptiveIcon: {
        ...appJson.expo.android?.adaptiveIcon,
        foregroundImage: "./assets/soundpulse-icon-2048.png",
        backgroundColor: "#0A0A1A",
      },
    },
    plugins,
    extra: {
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL,
      appSecretKey: process.env.EXPO_PUBLIC_APP_KEY,
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    },
  },
};
