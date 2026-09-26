// src/app/api/services/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { requireManagerSession } from "@/lib/auth";
import { sanitise } from "@/lib/validate";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const service = await queryOne("SELECT * FROM services WHERE id = ?", [parseInt(id)]);
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ service });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireManagerSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (body.category !== undefined) { fields.push("category = ?"); values.push(sanitise(body.category)); }
    if (body.name !== undefined) { fields.push("name = ?"); values.push(sanitise(body.name)); }
    if (body.description !== undefined) { fields.push("description = ?"); values.push(sanitise(body.description)); }
    if (body.duration_min !== undefined) { fields.push("duration_min = ?"); values.push(parseInt(body.duration_min) || null); }
    if (body.price_inr !== undefined) { fields.push("price_inr = ?"); values.push(body.price_inr !== "" ? parseInt(body.price_inr) : null); }
    if (body.is_placeholder !== undefined) { fields.push("is_placeholder = ?"); values.push(body.is_placeholder ? 1 : 0); }
    if (body.is_active !== undefined) { fields.push("is_active = ?"); values.push(body.is_active ? 1 : 0); }

    fields.push("updated_at = datetime('now')");
    values.push(parseInt(id));

    await execute(`UPDATE services SET ${fields.join(", ")} WHERE id = ?`, values);

    const service = await queryOne("SELECT * FROM services WHERE id = ?", [parseInt(id)]);
    return NextResponse.json({ service });
  } catch (err) {
    console.error("[services-put]", err);
    return NextResponse.json({ error: "Failed to update service." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireManagerSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await execute("UPDATE services SET is_active = 0 WHERE id = ?", [parseInt(id)]);
  return NextResponse.json({ ok: true });
}
