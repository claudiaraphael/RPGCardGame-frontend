// ==========================================================
// SCHEMA: ticket (sugestão de feature, bug, suporte)
// ==========================================================
// Mesmo raciocínio de personagemSchema.ts: shape base sem default,
// reaproveitado no schema de criação (com default) e no de atualização de
// status (parcial, só o que o admin manda).

import { z } from "zod";

// "pedidos" (solicitações especiais/de mestre) entrou junto com o campo de
// prioridade abaixo, pra bater com a Central de Suporte Arcano do mockup
// (documentacao/aurorargp_support_mockup...jpg): 4 categorias, não 3.
export const ticketTypeSchema = z.enum(["feature", "bug", "support", "pedidos"]);
export type TicketType = z.infer<typeof ticketTypeSchema>;

export const ticketStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
  "closed",
]);
export type TicketStatus = z.infer<typeof ticketStatusSchema>;

export const ticketPrioritySchema = z.enum(["baixa", "media", "alta", "critica"]);
export type TicketPriority = z.infer<typeof ticketPrioritySchema>;

export const createTicketSchema = z.object({
  type: ticketTypeSchema,
  title: z.string().min(3).max(120).trim(),
  description: z.string().min(1).max(4000).trim(),
  priority: ticketPrioritySchema.default("media"),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

// PATCH: status é obrigatório (é o campo que dispara a atualização),
// admin_note é opcional — admin pode só mudar o status sem comentar.
export const updateTicketStatusSchema = z.object({
  status: ticketStatusSchema,
  adminNote: z.string().max(4000).trim().optional(),
});
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;

export const listTicketsQuerySchema = z.object({
  status: ticketStatusSchema.optional(),
  type: ticketTypeSchema.optional(),
});
