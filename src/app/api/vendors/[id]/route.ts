import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role === "CASHIER") {
    return NextResponse.json({ error: "Manager or admin only" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const vendor = await db.vendor.update({
    where: { id },
    data: {
      name: body.name,
      companyName: body.companyName || null,
      phone: body.phone || null,
      address: body.address || null,
      note: body.note || null,
      active: body.active !== false,
    },
  });
  return NextResponse.json({ vendor });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role === "CASHIER") {
    return NextResponse.json({ error: "Manager or admin only" }, { status: 403 });
  }
  const { id } = await params;
  await db.vendor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
