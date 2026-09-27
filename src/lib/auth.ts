// src/lib/auth.ts
// Authentication helpers for JWT-based session management.
// All functions here are server-only.

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { queryOne } from "@/lib/db";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "ansalon_session";
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me-in-production-please"
);

export type SessionPayload = {
  sub: string;        // manager id as string
  email: string;
  name: string;
  role: "manager";
  pwv: number;        // password_version — invalidates old tokens on password change
};

export type CustomerSessionPayload = {
  sub: string;        // customer id as string
  email: string;
  name: string;
  role: "customer";
};

export type AnySession = SessionPayload | CustomerSessionPayload;

// ── Token creation ───────────────────────────────────────────────────────────

export async function createToken(payload: AnySession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

// ── Token verification ───────────────────────────────────────────────────────

export async function verifyToken(token: string): Promise<AnySession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as AnySession;
  } catch {
    return null;
  }
}

// ── Cookie helpers ───────────────────────────────────────────────────────────

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<AnySession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ── Request-based auth (for API routes) ─────────────────────────────────────

export async function getSessionFromRequest(
  req: NextRequest
): Promise<AnySession | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireManagerSession(
  req: NextRequest
): Promise<SessionPayload | null> {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "manager") return null;
  const s = session as SessionPayload;

  // Verify password_version matches DB — invalidates tokens from before a password change
  const manager = await queryOne<{ password_version: number }>(
    "SELECT password_version FROM managers WHERE id = ?",
    [Number(s.sub)]
  );
  if (!manager || manager.password_version !== (s.pwv ?? 0)) return null;

  return s;
}

export async function requireCustomerSession(
  req: NextRequest
): Promise<CustomerSessionPayload | null> {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "customer") return null;
  return session as CustomerSessionPayload;
}
