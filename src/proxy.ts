// src/proxy.ts
// Next.js 16+ proxy (previously middleware): protect /dashboard and /my-appointments.
// Uses the session JWT cookie for fast edge-level auth checks.

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me-in-production-please"
);
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "ansalon_session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect manager dashboard
  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/manager/login", req.url));
    }
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (payload.role !== "manager") {
        return NextResponse.redirect(new URL("/manager/login", req.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/manager/login", req.url));
    }
  }

  // Protect customer-only pages
  if (pathname.startsWith("/my-appointments")) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (payload.role !== "customer") {
        return NextResponse.redirect(new URL("/signin", req.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/my-appointments/:path*"],
};
