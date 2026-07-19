import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role === "CASHIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const body = await req.json();
  const exists = await db.category.findUnique({ where: { name: body.name } });
  if (exists) {
    return NextResponse.json({ error: "Category already exists" }, { status: 400 });
  }
  const category = await db.category.create({
    data: { name: body.name, icon: body.icon || null },
  });
  return NextResponse.json({ category });
}
