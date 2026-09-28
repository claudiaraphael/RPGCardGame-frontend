// ==========================================================
// ROTAS: admin
// ==========================================================
// Mesmo padrão de authRoutes.ts/personagemRoutes.ts. Toda rota exige login
// (requireAuth) E role "admin" (requireAdmin) — nessa ordem, porque
// requireAdmin depende de req.auth já ter sido preenchido.

import { Router, type Request, type Response } from "express";
import { requireAuth } from "./requireAuth";
import { requireAdmin } from "./requireAdmin";
import { userRepository } from "./userRepository";
import type { User } from "./User";

const router = Router();

router.use(requireAuth, requireAdmin);

type PublicUser = Omit<User, "passwordHash">;

function publicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * GET /admin/users
 *
 * Lista todos os usuários cadastrados (sem o hash de senha).
 */
router.get("/users", (_req: Request, res: Response): void => {
  const users = userRepository.findAll().map(publicUser);
  res.status(200).json({ users });
});

export default router;
