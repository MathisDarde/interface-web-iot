import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { z } from "zod";

import { env } from "../env.js";
import prisma from "../prisma.js";

type PublicUser = {
  id: string;
  email: string;
  pseudo: string;
  phone: string;
};

function hasCode(err: unknown): err is { code: string } {
  return typeof err === "object" && err !== null && "code" in err;
}

function signToken(user: PublicUser) {
  return jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

const registerSchema = z.object({
  pseudo: z.string().min(2).max(50).trim(),
  email: z.string().email().toLowerCase(),
  phone: z.string().min(6).max(30).trim(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "INVALID_BODY", details: parsed.error.flatten() });
  }

  const { pseudo, email, phone, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: { pseudo, email, phone, passwordHash },
      select: { id: true, email: true, pseudo: true, phone: true },
    });

    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (err: unknown) {
    if (hasCode(err) && err.code === "P2002") {
      return res.status(409).json({ error: "EMAIL_ALREADY_USED" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "INVALID_BODY", details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const userRecord = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      pseudo: true,
      phone: true,
      passwordHash: true,
    },
  });

  if (!userRecord) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  }

  const ok = await bcrypt.compare(password, userRecord.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  }

  const user: PublicUser = {
    id: userRecord.id,
    email: userRecord.email,
    pseudo: userRecord.pseudo,
    phone: userRecord.phone,
  };

  const token = signToken(user);
  return res.json({ token, user });
}
