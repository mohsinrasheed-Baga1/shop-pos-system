import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const sale = await db.sale.findUnique({
    where: { id },
    include: { items: true, user: { select: { name: true } } },
  });
  if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ sale });
}
