import express from "express";
import cors from "cors";

import { env } from "./env.js";
import authRoutes from "./routes/authRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import playersRoutes from "./routes/playersRoutes.js";

const app = express();

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

const allowedOrigins = env.FRONTEND_ORIGIN.split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    // Requests from same-origin/non-browser clients may omit the Origin header.
    if (!origin) return callback(null, true);

    const normalized = normalizeOrigin(origin);
    const ok = allowedOrigins.includes(normalized);
    return callback(ok ? null : new Error("CORS_NOT_ALLOWED"), ok);
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Explicit preflight handling (Express 5 doesn't accept "*" route patterns)
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/players", playersRoutes);

export default app;
