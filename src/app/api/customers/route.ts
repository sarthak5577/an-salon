// src/app/api/customers/route.ts – Manager only
import { NextRequest, NextResponse } from "next/server";
import { queryOne, queryAll } from "@/lib/db";
import { requireManagerSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await requireManagerSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = "SELECT id, name, email, phone, created_at FROM customers WHERE 1=1";
  const params: string[] = [];

  if (search) {
    query += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const countRow = await queryOne<{ n: number }>(`SELECT COUNT(*) as n FROM (${query})`, params);
  const total = countRow?.n || 0;

  query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
  const customers = await queryAll(query, params);

  return NextResponse.json({ customers, total, page, limit });
}
