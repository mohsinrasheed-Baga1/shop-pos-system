import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "صرف ایڈمن" }, { status: 403 });
  }
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "صرف ایڈمن" }, { status: 403 });
  }
  const body = await req.json();
  const email = body.email?.toLowerCase().trim();
  if (!email || !body.name || !body.password) {
    return NextResponse.json({ error: "تمام ضروری فیلڈز بھریں" }, { status: 400 });
  }
  const dup = await db.user.findUnique({ where: { email } });
  if (dup) {
    return NextResponse.json({ error: "ای میل موجود ہے" }, { status: 400 });
  }
  const hash = await bcrypt.hash(body.password, 10);
  const created = await db.user.create({
    data: {
      email,
      name: body.name,
      password: hash,
      phone: body.phone || null,
      role: body.role || "CASHIER",
      active: body.active !== false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ user: created });
}
