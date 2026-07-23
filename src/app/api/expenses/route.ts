import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const today = searchParams.get("today") === "true";
  const where: any = {};
  if (today) {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }
  const expenses = await db.expense.findMany({ where, orderBy: { date: "desc" }, take: 200 });
  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role === "CASHIER") {
    return NextResponse.json({ error: "Manager or admin only" }, { status: 403 });
  }
  const body = await req.json();
  if (!body.title || !body.amount) {
    return NextResponse.json({ error: "Title and amount required" }, { status: 400 });
  }
  const expense = await db.expense.create({
    data: {
      title: body.title,
      amount: Number(body.amount),
      category: body.category || "general",
      note: body.note || null,
      date: body.date ? new Date(body.date) : new Date(),
    },
  });
  return NextResponse.json({ expense });
}
