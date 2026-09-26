// src/app/api/auth/manager/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryOne, execute } from "@/lib/db";
import { requireManagerSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await requireManagerSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const currentPassword = body.currentPassword || "";
    const newPassword = body.newPassword || "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Both current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const manager = await queryOne<{ id: number; password_hash: string }>(
      "SELECT id, password_hash FROM managers WHERE id = ?",
      [Number(session.sub)]
    );

    if (!manager) {
      return NextResponse.json({ error: "Manager account not found." }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, manager.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await execute("UPDATE managers SET password_hash = ? WHERE id = ?", [newHash, manager.id]);

    return NextResponse.json({
      ok: true,
      message: "Password changed successfully.",
    });
  } catch (err) {
    console.error("[change-password]", err);
    return NextResponse.json(
      { error: "An error occurred while updating the password. Please try again." },
      { status: 500 }
    );
  }
}
