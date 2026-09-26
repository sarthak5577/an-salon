// src/app/api/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { queryAll, queryOne, execute } from "@/lib/db";
import { requireManagerSession } from "@/lib/auth";
import { sanitise } from "@/lib/validate";

// Public: list active services
export async function GET() {
  const services = await queryAll(
    "SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order, id"
  );
  return NextResponse.json({ services });
}

// Manager only: create service
export async function POST(req: NextRequest) {
  const session = await requireManagerSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const category = sanitise(body.category || "");
    const name = sanitise(body.name || "");
    const description = sanitise(body.description || "");
    const duration_min = parseInt(body.duration_min) || null;
    const price_inr = body.price_inr !== "" ? parseInt(body.price_inr) : null;
    const is_placeholder = body.is_placeholder ? 1 : 0;

    if (!category || !name) {
      return NextResponse.json({ error: "Category and name are required." }, { status: 400 });
    }

    const maxRow = await queryOne<{ m: number | null }>("SELECT MAX(sort_order) as m FROM services");
    const maxOrder = maxRow?.m || 0;

    const result = await execute(`
      INSERT INTO services (category, name, description, duration_min, price_inr, is_placeholder, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [category, name, description, duration_min, price_inr, is_placeholder, maxOrder + 1]);

    const service = await queryOne("SELECT * FROM services WHERE id = ?", [result.lastInsertRowid]);
    return NextResponse.json({ service }, { status: 201 });
  } catch (err) {
    console.error("[services-post]", err);
    return NextResponse.json({ error: "Failed to create service." }, { status: 500 });
  }
}
