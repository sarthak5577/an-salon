// src/app/api/availability/route.ts
// Returns booked time slots for a given date so the booking form can grey them out.
import { NextRequest, NextResponse } from "next/server";
import { queryAll } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ booked: [] });

  const booked = await queryAll<{ appt_time: string }>(
    "SELECT appt_time FROM appointments WHERE appt_date = ? AND status NOT IN ('cancelled')",
    [date]
  );

  return NextResponse.json({ booked: booked.map((b) => b.appt_time) });
}
