import express from "express";
import cors from "cors";

import { env } from "./env.js";
import authRoutes from "./routes/authRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import playersRoutes from "./routes/playersRoutes.js";

const app = express();

const allowedOrigins = env.FRONTEND_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Explicit preflight handling (Express 5 doesn't accept "*" route patterns)
app.options(/.*/, cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/players", playersRoutes);

app.listen(env.PORT, () => {
  console.log(`Auth backend listening on http://localhost:${env.PORT}`);
});
