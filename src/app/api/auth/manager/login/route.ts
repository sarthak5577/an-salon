// src/app/api/auth/manager/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryOne } from "@/lib/db";
import { createToken, setSessionCookie } from "@/lib/auth";
import { validateEmail, sanitise } from "@/lib/validate";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Allow 5 login attempts per 15 minutes per IP
const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = getClientIp(req);
  const rl = rateLimit(`manager-login:${ip}`, LIMIT, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many login attempts. Please try again in ${rl.retryAfterSec} seconds.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const email = sanitise(body.email || "").toLowerCase();
    const password = body.password || "";

    const emailCheck = validateEmail(email);
    if (!emailCheck.ok) return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    if (!password) return NextResponse.json({ error: "Password is required." }, { status: 400 });

    const manager = await queryOne<{
      id: number;
      name: string;
      email: string;
      password_hash: string;
      password_version: number;
    }>(
      "SELECT id, name, email, password_hash, password_version FROM managers WHERE email = ?",
      [email]
    );

    if (!manager || !(await bcrypt.compare(password, manager.password_hash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await createToken({
      sub: String(manager.id),
      email: manager.email,
      name: manager.name,
      role: "manager",
      pwv: manager.password_version,
    });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, name: manager.name });
  } catch (err) {
    console.error("[manager-login]", err);
    return NextResponse.json({ error: "Sign-in failed. Please try again." }, { status: 500 });
  }
}
