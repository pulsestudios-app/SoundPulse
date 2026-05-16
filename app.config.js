const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});

const appJson = require("./app.json");

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL,
      appSecretKey: process.env.EXPO_PUBLIC_APP_KEY,
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    },
  },
};
