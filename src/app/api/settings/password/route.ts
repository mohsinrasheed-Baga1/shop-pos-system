import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import bcrypt from "bcryptjs";

// Change own password
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { currentPassword, newPassword } = body;
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 chars" }, { status: 400 });
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ok = await bcrypt.compare(currentPassword || "", dbUser.password);
  if (!ok) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await db.user.update({ where: { id: user.id }, data: { password: hash } });
  return NextResponse.json({ ok: true });
}
