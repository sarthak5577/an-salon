// src/app/api/auth/customer/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryOne } from "@/lib/db";
import { createToken, setSessionCookie } from "@/lib/auth";
import { validateEmail, sanitise } from "@/lib/validate";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Allow 10 login attempts per 15 minutes per IP
const LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = getClientIp(req);
  const rl = rateLimit(`customer-login:${ip}`, LIMIT, WINDOW_MS);
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

    const customer = await queryOne<{ id: number; name: string; email: string; password_hash: string }>(
      "SELECT id, name, email, password_hash FROM customers WHERE email = ?",
      [email]
    );

    if (!customer || !(await bcrypt.compare(password, customer.password_hash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await createToken({
      sub: String(customer.id),
      email: customer.email,
      name: customer.name,
      role: "customer",
    });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, name: customer.name, email: customer.email });
  } catch (err) {
    console.error("[customer-login]", err);
    return NextResponse.json({ error: "Sign-in failed. Please try again." }, { status: 500 });
  }
}
