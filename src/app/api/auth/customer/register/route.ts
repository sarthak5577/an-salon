// src/app/api/auth/customer/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryOne, execute } from "@/lib/db";
import { createToken, setSessionCookie } from "@/lib/auth";
import {
  validateEmail, validatePassword, validateName, validatePhone, sanitise
} from "@/lib/validate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = sanitise(body.name || "");
    const email = sanitise(body.email || "").toLowerCase();
    const phone = sanitise(body.phone || "");
    const password = body.password || "";

    const nameCheck = validateName(name);
    if (!nameCheck.ok) return NextResponse.json({ error: nameCheck.error }, { status: 400 });

    const emailCheck = validateEmail(email);
    if (!emailCheck.ok) return NextResponse.json({ error: emailCheck.error }, { status: 400 });

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.ok) return NextResponse.json({ error: phoneCheck.error }, { status: 400 });

    const passCheck = validatePassword(password);
    if (!passCheck.ok) return NextResponse.json({ error: passCheck.error }, { status: 400 });

    const existing = await queryOne<{ id: number }>("SELECT id FROM customers WHERE email = ?", [email]);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await execute(
      "INSERT INTO customers (name, email, phone, password_hash) VALUES (?, ?, ?, ?)",
      [name, email, phone, hash]
    );

    const token = await createToken({
      sub: String(result.lastInsertRowid),
      email,
      name,
      role: "customer",
    });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, name, email });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
