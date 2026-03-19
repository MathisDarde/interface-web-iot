import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { env } from "../env.js";

type JwtPayload = {
  sub?: string;
  email?: string;
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : null;

  if (!token) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (req as any).auth = { userId: decoded.sub, email: decoded.email };
    return next();
  } catch {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
}
