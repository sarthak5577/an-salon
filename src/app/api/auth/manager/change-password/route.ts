// src/app/api/auth/manager/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryOne, execute } from "@/lib/db";
import { requireManagerSession, createToken, setSessionCookie, clearSessionCookie } from "@/lib/auth";

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

    const manager = await queryOne<{
      id: number;
      password_hash: string;
      name: string;
      email: string;
      password_version: number;
    }>(
      "SELECT id, name, email, password_hash, password_version FROM managers WHERE id = ?",
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
    const newVersion = (manager.password_version || 0) + 1;

    // Update password AND increment version atomically
    await execute(
      "UPDATE managers SET password_hash = ?, password_version = ? WHERE id = ?",
      [newHash, newVersion, manager.id]
    );

    // Clear the old session cookie so the manager is logged out on all devices
    await clearSessionCookie();

    // Issue a fresh token with the new password version so this device stays logged in
    const newToken = await createToken({
      sub: String(manager.id),
      email: manager.email,
      name: manager.name,
      role: "manager",
      pwv: newVersion,
    });
    await setSessionCookie(newToken);

    return NextResponse.json({
      ok: true,
      message: "Password changed successfully. All other sessions have been invalidated.",
    });
  } catch (err) {
    console.error("[change-password]", err);
    return NextResponse.json(
      { error: "An error occurred while updating the password. Please try again." },
      { status: 500 }
    );
  }
}
