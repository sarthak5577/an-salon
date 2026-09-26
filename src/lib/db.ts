// src/lib/db.ts
// Universal Database Layer: Supports both local SQLite and Turso Cloud SQLite.
// Powered by @libsql/client (100% free, serverless-ready, zero native compilation).

import { createClient, Client } from "@libsql/client";
import path from "path";
import fs from "fs";

let client: Client | null = null;
let initPromise: Promise<void> | null = null;

export function getDb(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL || "file:data/ansalon.db";
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

  // If using local file, ensure data directory exists
  if (url.startsWith("file:")) {
    const rawPath = url.slice(5);
    const resolvedPath = path.isAbsolute(rawPath)
      ? rawPath
      : path.join(process.cwd(), "data", path.basename(rawPath));
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  client = createClient({
    url,
    authToken,
  });

  return client;
}

export async function initDb(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = getDb();

    await db.batch([
      `CREATE TABLE IF NOT EXISTS managers (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT NOT NULL,
        email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        created_at    TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS services (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        category      TEXT NOT NULL,
        name          TEXT NOT NULL,
        description   TEXT,
        duration_min  INTEGER,
        price_inr     INTEGER,
        is_placeholder INTEGER NOT NULL DEFAULT 0,
        is_active     INTEGER NOT NULL DEFAULT 1,
        sort_order    INTEGER NOT NULL DEFAULT 0,
        created_at    TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS business_settings (
        key        TEXT PRIMARY KEY,
        value      TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS customers (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT NOT NULL,
        email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
        phone         TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at    TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS appointments (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        service_id  INTEGER NOT NULL REFERENCES services(id),
        appt_date   TEXT NOT NULL,
        appt_time   TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'pending',
        notes       TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(appt_date, appt_time)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_appt_date ON appointments(appt_date)`,
      `CREATE INDEX IF NOT EXISTS idx_appt_customer ON appointments(customer_id)`
    ], "write");

    // Seed default business settings
    const defaults = [
      ["walkin_status", "Walk-ins are welcome. Availability depends on the salon's current schedule. Call us to check before visiting."],
      ["hours_note", "Business hours are set by the salon manager. Please call us at 080 6452 6928 to confirm current hours."],
      ["booking_notice", "Appointments are required for scheduled services. Online booking is available below. Walk-ins are also welcome subject to availability."],
    ];

    for (const [key, value] of defaults) {
      await db.execute({
        sql: "INSERT OR IGNORE INTO business_settings (key, value) VALUES (?, ?)",
        args: [key, value],
      });
    }

    // Seed services if table is empty
    const countRes = await db.execute("SELECT COUNT(*) as count FROM services");
    const count = Number(countRes.rows[0]?.count || 0);

    if (count === 0) {
      const seedServices = [
        ["Hair Styling & Dressing", "Haircut & Styling", "Professional consultation, precision cut, and styling tailored to your face shape.", 45, 600, 1, 1],
        ["Hair Styling & Dressing", "Blow Dry & Finish", "Volumizing or sleek blow dry for any occasion.", 30, 400, 1, 2],
        ["Hair Styling & Dressing", "Hair Spa & Deep Conditioning", "Intensive nourishing treatment to restore shine and hair health.", 60, 1200, 1, 3],
        ["Hair Treatments", "Keratin Treatment", "Smoothing protein treatment that eliminates frizz and adds long-lasting shine.", 120, 3500, 1, 4],
        ["Hair Treatments", "Scalp Care & Dandruff Treatment", "Targeted therapy to cleanse, soothe, and balance the scalp.", 45, 900, 1, 5],
        ["Beauty & Skin Care", "Signature Facial", "Customised deep-cleanse facial with gentle exfoliation and hydrating mask.", 60, 1500, 1, 6],
        ["Beauty & Skin Care", "Cleanup & Glow Therapy", "Quick skin-revitalising treatment perfect before special occasions.", 40, 800, 1, 7],
        ["Bridal & Occasions", "Bridal Makeup & Styling", "Complete bridal look consultation, styling, and makeup.", 180, 8000, 1, 8],
        ["Bridal & Occasions", "Party Makeup", "Glamorous evening or event styling and makeup.", 75, 2500, 1, 9],
        ["Hand & Feet Care", "Classic Manicure", "Nail shaping, cuticle care, hand scrub, and polish.", 40, 500, 1, 10],
        ["Hand & Feet Care", "Deluxe Pedicure", "Relaxing foot soak, scrub, nail grooming, and gentle foot massage.", 50, 700, 1, 11],
      ];

      for (const [cat, name, desc, dur, price, ph, order] of seedServices) {
        await db.execute({
          sql: `INSERT INTO services (category, name, description, duration_min, price_inr, is_placeholder, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [cat, name, desc, dur, price, ph, order],
        });
      }
    }

    // Seed default manager account if table is empty (e.g. fresh Turso Cloud DB)
    const mgrCountRes = await db.execute("SELECT COUNT(*) as count FROM managers");
    const mgrCount = Number(mgrCountRes.rows[0]?.count || 0);

    if (mgrCount === 0) {
      await db.execute({
        sql: `INSERT INTO managers (name, email, password_hash) VALUES (?, ?, ?)`,
        args: [
          "Salon Manager",
          "manager@ansalon.in",
          "$2a$12$GqE5/v0RbtqciNYi.YhMdOzyH9V1iT7Ls4kV02UcERHOU/aZ18Ezi", // Default: ANsalon123
        ],
      });
    }
  })();

  return initPromise;
}

// ── Query Helpers ─────────────────────────────────────────────────────────────

export async function queryOne<T = Record<string, any>>(
  sql: string,
  args: any[] = []
): Promise<T | null> {
  await initDb();
  const db = getDb();
  const res = await db.execute({ sql, args });
  return (res.rows[0] as unknown as T) || null;
}

export async function queryAll<T = Record<string, any>>(
  sql: string,
  args: any[] = []
): Promise<T[]> {
  await initDb();
  const db = getDb();
  const res = await db.execute({ sql, args });
  return res.rows as unknown as T[];
}

export async function execute(
  sql: string,
  args: any[] = []
): Promise<{ lastInsertRowid: number; rowsAffected: number }> {
  await initDb();
  const db = getDb();
  const res = await db.execute({ sql, args });
  return {
    lastInsertRowid: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0,
    rowsAffected: res.rowsAffected,
  };
}
