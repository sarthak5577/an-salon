// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";
import { requireManagerSession } from "@/lib/auth";
import { sanitise } from "@/lib/validate";

// Public: read settings
export async function GET() {
  const rows = await queryAll<{ key: string; value: string }>(
    "SELECT key, value FROM business_settings"
  );
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  return NextResponse.json({ settings });
}

// Manager: update settings
export async function POST(req: NextRequest) {
  const session = await requireManagerSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const allowed = [
      "walkin_status", "hours_note", "booking_notice",
      "hours_monday", "hours_tuesday", "hours_wednesday",
      "hours_thursday", "hours_friday", "hours_saturday", "hours_sunday"
    ];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        await execute(
          `INSERT INTO business_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
          [key, sanitise(String(body[key]))]
        );
      }
    }

    const rows = await queryAll<{ key: string; value: string }>(
      "SELECT key, value FROM business_settings"
    );
    const settings: Record<string, string> = {};
    for (const row of rows) settings[row.key] = row.value;

    return NextResponse.json({ settings });
  } catch (err) {
    console.error("[settings-post]", err);
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }
}
