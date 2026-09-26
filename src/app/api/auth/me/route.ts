// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: { sub: session.sub, email: session.email, name: session.name, role: session.role },
  });
}
