export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface D1BoundStatement {
  run: () => Promise<{ meta?: { last_row_id?: number } }>;
  all: () => Promise<{ results: unknown[] }>;
}
interface D1Database {
  prepare: (query: string) => {
    bind: (...args: unknown[]) => D1BoundStatement;
    all: () => Promise<{ results: unknown[] }>;
  };
}

async function getDB(): Promise<D1Database> {
  if (process.env.NODE_ENV === "development") {
    const Database = require("better-sqlite3");
    const path = require("path");
    const sqlite = new Database(path.join(process.cwd(), "local.db"));
    return {
      prepare: (query: string) => ({
        bind: (...args: unknown[]) => ({
          run: async () => {
            const result = sqlite.prepare(query).run(...args);
            return { meta: { last_row_id: result.lastInsertRowid as number } };
          },
          all: async () => ({ results: sqlite.prepare(query).all(...args) }),
        }),
        all: async () => ({ results: sqlite.prepare(query).all() }),
      }),
    };
  }
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as { DB: D1Database }).DB;
  if (!db) throw new Error("D1 DB binding is missing.");
  return db;
}

export async function GET() {
  try {
    const db = await getDB();
    const res = await db.prepare("SELECT * FROM carousel_items ORDER BY sort_order ASC, id ASC").all();
    return NextResponse.json({ results: res.results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDB();
    const { image_url, link_type, link_value, sort_order } = (await req.json()) as {
      image_url?: string; link_type?: string; link_value?: string; sort_order?: number;
    };
    if (!image_url || !link_type || !link_value) {
      return NextResponse.json({ error: "image_url, link_type, link_value required" }, { status: 400 });
    }
    const result = await db
      .prepare("INSERT INTO carousel_items (image_url, link_type, link_value, sort_order) VALUES (?, ?, ?, ?)")
      .bind(image_url, link_type, link_value, sort_order ?? 0)
      .run();
    return NextResponse.json({ success: true, id: result.meta?.last_row_id }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDB();
    const { id } = (await req.json()) as { id?: unknown };
    const numId = Number(id);
    if (!numId || isNaN(numId)) {
      return NextResponse.json({ error: "Valid id required" }, { status: 400 });
    }
    await db.prepare("DELETE FROM carousel_items WHERE id = ?").bind(numId).run();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}