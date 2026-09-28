// ==========================================================
// ROTAS: tickets (sugestão de feature, bug, suporte)
// ==========================================================
// Mesmo padrão de personagem/personagemRoutes.ts: toda rota exige login
// (requireAuth), dono verificado por req.auth.sub (nunca por campo do
// corpo). Rotas de admin (listar todos, mudar status) exigem requireAdmin
// além de requireAuth.

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../auth/requireAuth";
import { requireAdmin } from "../auth/requireAdmin";
import { asyncHandler } from "../src/errors/asyncHandler";
import { AppError } from "../src/errors/AppError";
import { ticketRepository } from "./ticketRepository";
import {
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketStatusSchema,
} from "./ticketSchema";

const router = Router();

router.use(requireAuth);

/**
 * POST /tickets
 *
 * Usuário autenticado cria um ticket (feature, bug ou support).
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const result = createTicketSchema.safeParse(req.body);

    if (!result.success) {
      throw new AppError(400, "Dados inválidos");
    }

    const ticket = ticketRepository.create(req.auth!.sub, result.data);
    res.status(201).json({ ticket });
  }),
);

/**
 * GET /tickets/me
 *
 * Lista só os tickets do usuário autenticado.
 */
router.get(
  "/me",
  asyncHandler(async (req: Request, res: Response) => {
    const tickets = ticketRepository.findAllByUser(req.auth!.sub);
    res.status(200).json({ tickets });
  }),
);

/**
 * GET /tickets
 *
 * Admin lista todos os tickets, com filtro opcional por status/type.
 */
router.get(
  "/",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = listTicketsQuerySchema.safeParse(req.query);

    if (!result.success) {
      throw new AppError(400, "Filtro inválido");
    }

    const tickets = ticketRepository.findAll(result.data);
    res.status(200).json({ tickets });
  }),
);

/**
 * PATCH /tickets/:id
 *
 * Admin muda o status do ticket e/ou adiciona uma nota.
 */
router.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = updateTicketStatusSchema.safeParse(req.body);

    if (!result.success) {
      throw new AppError(400, "Dados inválidos");
    }

    const id = String(req.params.id);
    const ticket = ticketRepository.updateStatus(id, result.data);

    if (!ticket) {
      throw new AppError(404, "Ticket não encontrado");
    }

    res.status(200).json({ ticket });
  }),
);

export default router;
