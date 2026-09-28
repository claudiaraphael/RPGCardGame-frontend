// ==========================================================
// WRAPPER PRA ROTA ASSÍNCRONA
// ==========================================================
// Express 5 já propaga rejeição de Promise pro error handler sozinho (isso
// mudou desde o Express 4), mas escrever `try/catch` toda hora ainda é
// repetitivo. asyncHandler só encaminha qualquer erro (síncrono ou de
// Promise) pro `next(err)`, sem esconder nada — usado nas rotas novas
// (tickets/admin); rotas existentes (auth, personagem) não são tocadas.

import type { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}
