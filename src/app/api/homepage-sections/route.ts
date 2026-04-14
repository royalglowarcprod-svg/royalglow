export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// ── DB helper (same pattern as banners route) ──────────────────────────────
function getDB() {
  if (process.env.NODE_ENV === "development") {
    const Database = require("better-sqlite3");
    const path = require("path");
    return new Database(path.join(process.cwd(), "local.db"));
  }
  const { env } = getCloudflareContext();
  return (env as any).DB;
}

const isDev = process.env.NODE_ENV === "development";

// ── Types ──────────────────────────────────────────────────────────────────
// Each row in homepage_sections stores one independent section block.
// `items` is a JSON string of that section's own data array.
export type SectionType = "promo_banners" | "category_carousel" | "brand_grid" | "category_circles";

export interface HomepageSection {
  id: number;
  type: SectionType;
  label: string;       // admin-visible name, e.g. "Summer Sale Banners"
  sort_order: number;
  enabled: number;     // 0 | 1  (SQLite has no boolean)
  items: string;       // JSON — array of SectionItem (see below)
}

// Items stored inside each section's `items` JSON:
export interface BannerItem   { id: string; image_url: string; heading: string; button_text: string; link_to?: string | null; sort_order?: number }
export interface CarouselItem { id: string; image_url: string; link_type: "product" | "category"; link_value: string; sort_order?: number }
export interface BrandItem    { id: string; name: string; logo_url?: string; link_url?: string; sort_order?: number }
export interface CategoryCircleItem { id: string; name: string; slug: string; image_url?: string }

// ── CREATE TABLE (run once in your migration) ─────────────────────────────
// CREATE TABLE IF NOT EXISTS homepage_sections (
//   id         INTEGER PRIMARY KEY AUTOINCREMENT,
//   type       TEXT    NOT NULL,
//   label      TEXT    NOT NULL DEFAULT '',
//   sort_order INTEGER NOT NULL DEFAULT 0,
//   enabled    INTEGER NOT NULL DEFAULT 1,
//   items      TEXT    NOT NULL DEFAULT '[]'
// );

// ── GET — list all sections ordered by sort_order ─────────────────────────
export async function GET() {
  try {
    const db = getDB();
    const sql = "SELECT * FROM homepage_sections ORDER BY sort_order ASC";
    const rows: HomepageSection[] = isDev
      ? db.prepare(sql).all()
      : (await db.prepare(sql).all()).results;

    return NextResponse.json({ results: rows ?? [] });
  } catch (err: any) {
    console.error("[homepage-sections] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}

// ── POST — create a new section ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const db = getDB();
    const body = (await req.json()) as {
      type: SectionType;
      label?: string;
      sort_order?: number;
      enabled?: boolean;
    };

    const { type, label = "", sort_order = 0, enabled = true } = body;

    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    const sql =
      "INSERT INTO homepage_sections (type, label, sort_order, enabled, items) VALUES (?, ?, ?, ?, ?)";
    const params = [type, label, sort_order, enabled ? 1 : 0, "[]"];

    let id: number;
    if (isDev) {
      const result = db.prepare(sql).run(...params);
      id = result.lastInsertRowid;
    } else {
      const result = await db.prepare(sql).bind(...params).run();
      id = result.meta?.last_row_id;
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("[homepage-sections] POST error:", err);
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
  }
}

// ── PATCH — update label / sort_order / enabled / items of a section ──────
export async function PATCH(req: NextRequest) {
  try {
    const db = getDB();
    const body = (await req.json()) as {
      id: number;
      label?: string;
      sort_order?: number;
      enabled?: boolean;
      items?: unknown[];   // full replacement array
    };

    const { id, ...fields } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const setClauses: string[] = [];
    const params: unknown[] = [];

    if (fields.label !== undefined)      { setClauses.push("label = ?");      params.push(fields.label); }
    if (fields.sort_order !== undefined) { setClauses.push("sort_order = ?"); params.push(fields.sort_order); }
    if (fields.enabled !== undefined)    { setClauses.push("enabled = ?");    params.push(fields.enabled ? 1 : 0); }
    if (fields.items !== undefined)      { setClauses.push("items = ?");      params.push(JSON.stringify(fields.items)); }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    params.push(id);
    const sql = `UPDATE homepage_sections SET ${setClauses.join(", ")} WHERE id = ?`;

    if (isDev) {
      db.prepare(sql).run(...params);
    } else {
      await db.prepare(sql).bind(...params).run();
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[homepage-sections] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
  }
}

// ── DELETE — remove a section entirely ───────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const db = getDB();

    let body: { id?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const id = Number(body?.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "A valid numeric id is required" }, { status: 400 });
    }

    const sql = "DELETE FROM homepage_sections WHERE id = ?";
    if (isDev) {
      db.prepare(sql).run(id);
    } else {
      await db.prepare(sql).bind(id).run();
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[homepage-sections] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}