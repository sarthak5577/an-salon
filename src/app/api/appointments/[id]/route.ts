// src/app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { requireManagerSession, requireCustomerSession } from "@/lib/auth";
import { sanitise } from "@/lib/validate";

const VALID_STATUSES = ["pending", "confirmed", "cancelled", "completed", "rescheduled"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const appointment = await queryOne<{ customer_id: number }>(`
    SELECT a.*, s.name as service_name, s.category, s.duration_min, s.price_inr,
           c.name as customer_name, c.email as customer_email, c.phone as customer_phone
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    JOIN customers c ON a.customer_id = c.id
    WHERE a.id = ?
  `, [parseInt(id)]);

  if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Manager can view any; customer can only view their own
  const managerSession = await requireManagerSession(req);
  if (managerSession) return NextResponse.json({ appointment });

  const customerSession = await requireCustomerSession(req);
  if (customerSession && appointment.customer_id === parseInt(customerSession.sub)) {
    return NextResponse.json({ appointment });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Manager: update status, date, time, notes
export async function PATCH(
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

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      fields.push("status = ?"); values.push(body.status);
    }
    if (body.appt_date !== undefined) { fields.push("appt_date = ?"); values.push(sanitise(body.appt_date)); }
    if (body.appt_time !== undefined) { fields.push("appt_time = ?"); values.push(sanitise(body.appt_time)); }
    if (body.notes !== undefined) { fields.push("notes = ?"); values.push(sanitise(body.notes)); }

    if (fields.length === 0) return NextResponse.json({ error: "No fields to update." }, { status: 400 });

    fields.push("updated_at = datetime('now')");
    values.push(parseInt(id));

    await execute(`UPDATE appointments SET ${fields.join(", ")} WHERE id = ?`, values);

    const appointment = await queryOne(`
      SELECT a.*, s.name as service_name, c.name as customer_name, c.email as customer_email
      FROM appointments a JOIN services s ON a.service_id = s.id
      JOIN customers c ON a.customer_id = c.id WHERE a.id = ?
    `, [parseInt(id)]);

    return NextResponse.json({ appointment });
  } catch (err) {
    console.error("[appointments-patch]", err);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}

// Customer: cancel own appointment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const appt = await queryOne<{ customer_id: number; status: string }>(
    "SELECT customer_id, status FROM appointments WHERE id = ?",
    [parseInt(id)]
  );

  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const managerSession = await requireManagerSession(req);
  if (managerSession) {
    await execute("UPDATE appointments SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?", [parseInt(id)]);
    return NextResponse.json({ ok: true });
  }

  const customerSession = await requireCustomerSession(req);
  if (customerSession && appt.customer_id === parseInt(customerSession.sub)) {
    if (appt.status === "cancelled") {
      return NextResponse.json({ error: "Appointment is already cancelled." }, { status: 400 });
    }
    await execute("UPDATE appointments SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?", [parseInt(id)]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
