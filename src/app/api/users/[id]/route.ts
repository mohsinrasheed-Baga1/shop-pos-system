import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "صرف ایڈمن" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const data: any = {
    name: body.name,
    phone: body.phone || null,
    role: body.role,
    active: body.active !== false,
  };
  if (body.password && body.password.length > 0) {
    data.password = await bcrypt.hash(body.password, 10);
  }

  const updated = await db.user.update({
    where: { id },
    data,
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
  return NextResponse.json({ user: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "صرف ایڈمن" }, { status: 403 });
  }
  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json({ error: "اپنا اکاؤنٹ نہیں مٹا سکتے" }, { status: 400 });
  }
  await db.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
