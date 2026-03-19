import type { Request, Response } from "express";
import { z } from "zod";

import prisma from "../prisma.js";

function hasCode(err: unknown): err is { code: string } {
  return typeof err === "object" && err !== null && "code" in err;
}

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(8).max(10).default(10),
  q: z
    .string()
    .optional()
    .transform((v) => v?.trim())
    .pipe(z.string().optional()),
});

const createSchema = z.object({
  pseudo: z.string().min(2).max(50).trim(),
  email: z.string().email().toLowerCase(),
  phone: z.string().min(6).max(30).trim(),
});

const idParamSchema = z.object({
  id: z.string().min(1),
});

export async function listPlayers(req: Request, res: Response) {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "INVALID_QUERY", details: parsed.error.flatten() });
  }

  const { page, pageSize, q } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = q
    ? {
        OR: [
          { pseudo: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q } },
        ],
      }
    : undefined;

  const [total, items] = await Promise.all([
    prisma.player.count({ where }),
    prisma.player.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        pseudo: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return res.json({
    items,
    total,
    page,
    pageSize,
    totalPages,
  });
}

export async function createPlayer(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "INVALID_BODY", details: parsed.error.flatten() });
  }

  const { pseudo, email, phone } = parsed.data;

  try {
    const player = await prisma.player.create({
      data: { pseudo, email, phone },
      select: {
        id: true,
        pseudo: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ player });
  } catch (err: unknown) {
    if (hasCode(err) && err.code === "P2002") {
      return res.status(409).json({ error: "EMAIL_ALREADY_USED" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function updatePlayer(req: Request, res: Response) {
  const parsedParams = idParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res
      .status(400)
      .json({ error: "INVALID_PARAMS", details: parsedParams.error.flatten() });
  }

  const parsedBody = createSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res
      .status(400)
      .json({ error: "INVALID_BODY", details: parsedBody.error.flatten() });
  }

  const { id } = parsedParams.data;
  const { pseudo, email, phone } = parsedBody.data;

  try {
    const player = await prisma.player.update({
      where: { id },
      data: { pseudo, email, phone },
      select: {
        id: true,
        pseudo: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    return res.json({ player });
  } catch (err: unknown) {
    if (hasCode(err) && err.code === "P2002") {
      return res.status(409).json({ error: "EMAIL_ALREADY_USED" });
    }
    if (hasCode(err) && err.code === "P2025") {
      return res.status(404).json({ error: "NOT_FOUND" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function deletePlayer(req: Request, res: Response) {
  const parsedParams = idParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res
      .status(400)
      .json({ error: "INVALID_PARAMS", details: parsedParams.error.flatten() });
  }

  const { id } = parsedParams.data;

  try {
    await prisma.player.delete({ where: { id } });
    return res.status(204).send();
  } catch (err: unknown) {
    if (hasCode(err) && err.code === "P2025") {
      return res.status(404).json({ error: "NOT_FOUND" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}
