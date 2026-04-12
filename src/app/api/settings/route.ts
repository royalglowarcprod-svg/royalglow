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
    const res = await db.prepare("SELECT * FROM settings").all();
    const settings: Record<string, string> = {};
    (res.results as { key: string; value: string }[]).forEach(r => {
      settings[r.key] = r.value;
    });
    return NextResponse.json({ settings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDB();
    const { key, value } = (await req.json()) as { key?: string; value?: string };
    if (!key?.trim() || value === undefined) {
      return NextResponse.json({ error: "key and value required" }, { status: 400 });
    }
    await db
      .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .bind(key.trim(), value)
      .run();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}