// ==========================================================
// APP EXPRESS: monta middlewares globais e rotas
// ==========================================================
// Reconstrução do esqueleto que existia antes da faxina (ver
// to-do/documentation/codigo-referencia-antigo.md) — mesmo padrão
// app/server separados, mas sem o CRUD de /cards em memória: as rotas
// agora servem dados reais da D&D API, já validados pelos schemas Zod
// de entidades-dnd/schemas/. Autenticação é por JWT (auth/authRoutes.ts),
// não por sessão — o cliente manda "Authorization: Bearer <token>" em
// cada request, não tem cookie de sessão envolvido.

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import entityRoutes from "./routes";
import authRoutes from "../auth/authRoutes";
import personagemRoutes from "../personagem/personagemRoutes";
import ticketRoutes from "../tickets/ticketRoutes";
import adminRoutes from "../auth/adminRoutes";
import { AppError } from "./errors/AppError";

const app = express();

app.use(helmet());

// Só em /auth/login e /auth/register (força bruta de senha e spam de
// contas) — /auth/me não precisa, é só leitura de quem já tem token válido.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas. Tente de novo em alguns minutos." },
});
app.use(["/auth/login", "/auth/register"], authLimiter);

// Origem explícita (regra do CLAUDE.md: nunca "origin: true"/"*" numa API
// que vai ganhar POST/PUT/DELETE). O front (RPGCardGame-frontend) roda em
// dev pela extensão Live Server do VS Code, que serve em 127.0.0.1:5500 ou
// localhost:5500 dependendo de como o VS Code está configurado. Sem
// "credentials: true" porque JWT não usa cookie — o token vai no header
// Authorization, então não precisa (nem faz sentido) CORS com credenciais.
app.use(
  cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
  })
);

app.use(express.json({ limit: "100kb" }));

app.use("/auth", authRoutes);
app.use("/personagens", personagemRoutes);
app.use("/tickets", ticketRoutes);
app.use("/admin", adminRoutes);
app.use(entityRoutes);

// Rota não mapeada.
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Error handler central: nunca expõe stack trace ao cliente (regra do
// CLAUDE.md). AppError é erro esperado (validação, dono errado, não
// encontrado etc.) — a mensagem dela é segura de mostrar. Qualquer outro
// erro (bug, exceção não prevista) vira 500 genérico, e só o servidor vê o
// detalhe real via console.error.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

export default app;
