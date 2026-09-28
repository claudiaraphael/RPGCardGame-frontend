// ==========================================================
// REPOSITÓRIO: tickets (SQLite)
// ==========================================================
// Mesmo padrão de personagem/personagemRepository.ts: CREATE TABLE aqui
// mesmo (só roda de verdade na primeira vez, por causa do IF NOT EXISTS) e
// um objeto com as operações em cima de better-sqlite3 (síncrono).

import { randomUUID } from "node:crypto";
import { db } from "../db/connection";
import type {
  CreateTicketInput,
  TicketPriority,
  TicketStatus,
  TicketType,
  UpdateTicketStatusInput,
} from "./ticketSchema";

export interface Ticket {
  id: string;
  userId: string;
  type: TicketType;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

type TicketRow = {
  id: string;
  user_id: string;
  type: TicketType;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

function mapRowToTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ATENÇÃO: esse CREATE TABLE só roda de verdade num banco novo (o
// IF NOT EXISTS pula se a tabela já existe). Se o database.sqlite local já
// tinha "tickets" da versão anterior (sem coluna priority, CHECK de type
// sem 'pedidos'), apagar o arquivo local e rodar de novo — não tem
// migração automática aqui (mesmo padrão simples do resto do projeto).
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('feature', 'bug', 'support', 'pedidos')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'media'
      CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
    status TEXT NOT NULL DEFAULT 'open'
      CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    admin_note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

export interface ListTicketsFilter {
  status?: TicketStatus;
  type?: TicketType;
}

export const ticketRepository = {
  findAllByUser(userId: string): Ticket[] {
    const rows = db
      .prepare(`
        SELECT *
        FROM tickets
        WHERE user_id = ?
        ORDER BY created_at DESC
      `)
      .all(userId) as TicketRow[];

    return rows.map(mapRowToTicket);
  },

  findAll(filter: ListTicketsFilter): Ticket[] {
    const conditions: string[] = [];
    const params: string[] = [];

    if (filter.status) {
      conditions.push("status = ?");
      params.push(filter.status);
    }

    if (filter.type) {
      conditions.push("type = ?");
      params.push(filter.type);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = db
      .prepare(`
        SELECT *
        FROM tickets
        ${where}
        ORDER BY created_at DESC
      `)
      .all(...params) as TicketRow[];

    return rows.map(mapRowToTicket);
  },

  findById(id: string): Ticket | null {
    const row = db
      .prepare(`
        SELECT *
        FROM tickets
        WHERE id = ?
      `)
      .get(id) as TicketRow | undefined;

    return row ? mapRowToTicket(row) : null;
  },

  create(userId: string, input: CreateTicketInput): Ticket {
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tickets (
        id, user_id, type, title, description, priority, status, admin_note, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'open', NULL, ?, ?)
    `).run(id, userId, input.type, input.title, input.description, input.priority, now, now);

    const created = this.findById(id);

    if (!created) {
      throw new Error("Failed to create ticket");
    }

    return created;
  },

  updateStatus(id: string, input: UpdateTicketStatusInput): Ticket | null {
    const existing = this.findById(id);

    if (!existing) {
      return null;
    }

    const nextAdminNote = input.adminNote ?? existing.adminNote;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE tickets
      SET status = ?, admin_note = ?, updated_at = ?
      WHERE id = ?
    `).run(input.status, nextAdminNote, now, id);

    return this.findById(id);
  },
};
