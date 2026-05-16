import * as Sentry from "@sentry/node";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";

import { v1Router } from "./routes/v1.js";

const sentryDsn = process.env.SENTRY_DSN?.trim();
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 0.2,
  });
}

export const app = express();

app.use(helmet());

const envOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (envOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    if (origin === "https://soundpulse.app") {
      callback(null, true);
      return;
    }
    if (/^exp:\/\//.test(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-app-key", "x-plan-tier", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

function validateAppKey(req: Request, res: Response, next: NextFunction): void {
  const expectedKey = process.env.APP_SECRET_KEY?.trim();
  if (!expectedKey) {
    next();
    return;
  }
  const raw = req.headers["x-app-key"];
  const appKey = Array.isArray(raw) ? raw[0] : raw;
  const appKeyValue = typeof appKey === "string" ? appKey : "";
  if (appKeyValue !== expectedKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

app.get("/", (_req, res) => {
  res.json({ service: "soundpulse-backend", status: "ok", docs: "/v1/health" });
});

app.use("/v1", (req: Request, res: Response, next: NextFunction) => {
  if (req.path === "/health") {
    next();
    return;
  }
  validateAppKey(req, res, next);
});

app.use("/v1", v1Router);

if (sentryDsn) {
  Sentry.setupExpressErrorHandler(app);
}
