import "dotenv/config";

import { app } from "./app.js";

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
