// ==========================================================
// MIDDLEWARE: exige role "admin"
// ==========================================================
// Roda sempre depois de requireAuth (precisa de req.auth já preenchido).
// role vem do payload do próprio JWT (authTypes.ts), não é consultado no
// banco a cada request — trade-off aceito aqui: um admin rebaixado a
// "user" só perde o acesso quando o token expirar (15 min, ver
// authService.ts), não instantaneamente.

import type { NextFunction, Request, Response } from "express";

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.auth?.role !== "admin") {
    res.status(403).json({ message: "Acesso restrito a administradores" });
    return;
  }

  next();
}
