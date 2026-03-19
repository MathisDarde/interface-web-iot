import type { Request, Response } from "express";
import { z } from "zod";

import prisma from "../prisma.js";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(8).max(10).default(10),
  q: z
    .string()
    .optional()
    .transform((v) => v?.trim())
    .pipe(z.string().optional()),
});

export async function listUsers(req: Request, res: Response) {
  const parsed = querySchema.safeParse(req.query);
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
    prisma.user.count({ where }),
    prisma.user.findMany({
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
