// src/app/api/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { queryOne, queryAll, execute } from "@/lib/db";
import { requireManagerSession, requireCustomerSession } from "@/lib/auth";
import { validateDate, validateTime, sanitise } from "@/lib/validate";

// Manager: list all appointments; Customer: list own appointments
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Try manager session first
  const managerSession = await requireManagerSession(req);
  if (managerSession) {
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const date = searchParams.get("date") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, s.name as service_name, s.category, s.duration_min, s.price_inr,
             c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN customers c ON a.customer_id = c.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (status) { query += " AND a.status = ?"; params.push(status); }
    if (date) { query += " AND a.appt_date = ?"; params.push(date); }
    if (search) {
      query += " AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR s.name LIKE ?)";
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    const countRow = await queryOne<{ n: number }>(`SELECT COUNT(*) as n FROM (${query})`, params);
    const total = countRow?.n || 0;

    query += ` ORDER BY a.appt_date DESC, a.appt_time DESC LIMIT ${limit} OFFSET ${offset}`;
    const appointments = await queryAll(query, params);

    return NextResponse.json({ appointments, total, page, limit });
  }

  // Try customer session
  const customerSession = await requireCustomerSession(req);
  if (customerSession) {
    const appointments = await queryAll(`
      SELECT a.*, s.name as service_name, s.category, s.duration_min, s.price_inr
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.customer_id = ?
      ORDER BY a.appt_date DESC, a.appt_time DESC
    `, [parseInt(customerSession.sub)]);
    return NextResponse.json({ appointments });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Customer: book appointment
export async function POST(req: NextRequest) {
  const customerSession = await requireCustomerSession(req);
  if (!customerSession) return NextResponse.json({ error: "Please sign in to book an appointment." }, { status: 401 });

  try {
    const body = await req.json();
    const service_id = parseInt(body.service_id);
    const appt_date = sanitise(body.appt_date || "");
    const appt_time = sanitise(body.appt_time || "");
    const notes = sanitise(body.notes || "");

    if (!service_id) return NextResponse.json({ error: "Please select a service." }, { status: 400 });

    const dateCheck = validateDate(appt_date);
    if (!dateCheck.ok) return NextResponse.json({ error: dateCheck.error }, { status: 400 });

    const timeCheck = validateTime(appt_time);
    if (!timeCheck.ok) return NextResponse.json({ error: timeCheck.error }, { status: 400 });

    // Verify service exists
    const service = await queryOne("SELECT id FROM services WHERE id = ? AND is_active = 1", [service_id]);
    if (!service) return NextResponse.json({ error: "Selected service is not available." }, { status: 400 });

    // Check slot availability
    const conflict = await queryOne(
      "SELECT id FROM appointments WHERE appt_date = ? AND appt_time = ? AND status NOT IN ('cancelled')",
      [appt_date, appt_time]
    );
    if (conflict) {
      return NextResponse.json(
        { error: "This time slot is already booked. Please choose a different time." },
        { status: 409 }
      );
    }

    const result = await execute(`
      INSERT INTO appointments (customer_id, service_id, appt_date, appt_time, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [parseInt(customerSession.sub), service_id, appt_date, appt_time, notes]);

    const appointment = await queryOne(`
      SELECT a.*, s.name as service_name, s.category, s.duration_min
      FROM appointments a JOIN services s ON a.service_id = s.id
      WHERE a.id = ?
    `, [result.lastInsertRowid]);

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err) {
    console.error("[appointments-post]", err);
    return NextResponse.json({ error: "Booking failed. Please try again." }, { status: 500 });
  }
}
