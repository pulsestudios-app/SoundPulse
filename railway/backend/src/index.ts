import "dotenv/config";

import { app } from "./app.js";

const isProduction = process.env.NODE_ENV === "production";
if (isProduction && !process.env.APP_SECRET_KEY?.trim()) {
  console.error("[SoundPulse] APP_SECRET_KEY is required when NODE_ENV=production");
  process.exit(1);
}

console.log("[SoundPulse] Starting server...");

try {
  const PORT = Number(process.env.PORT || 8080);
  console.log("[SoundPulse] PORT:", PORT);

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log("[SoundPulse] Server listening on", PORT);
  });

  server.on("error", (err) => {
    console.error("[SoundPulse] Server error:", err);
  });
} catch (err) {
  console.error("[SoundPulse] Startup error:", err);
  process.exit(1);
}
