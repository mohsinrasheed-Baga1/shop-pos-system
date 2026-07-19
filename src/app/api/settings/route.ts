import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await db.settings.findUnique({ where: { id: "shop" } });
  if (!settings) {
    const created = await db.settings.create({ data: { id: "shop" } });
    return NextResponse.json({ settings: created });
  }
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "صرف ایڈمن" }, { status: 403 });
  }
  const body = await req.json();
  const settings = await db.settings.upsert({
    where: { id: "shop" },
    update: {
      shopName: body.shopName,
      shopAddress: body.shopAddress,
      shopPhone: body.shopPhone,
      currency: body.currency,
      taxEnabled: body.taxEnabled === true,
      defaultTax: Number(body.defaultTax) || 0,
      receiptFooter: body.receiptFooter,
      invoicePrefix: body.invoicePrefix,
    },
    create: {
      id: "shop",
      shopName: body.shopName,
      shopAddress: body.shopAddress,
      shopPhone: body.shopPhone,
      currency: body.currency,
      taxEnabled: body.taxEnabled === true,
      defaultTax: Number(body.defaultTax) || 0,
      receiptFooter: body.receiptFooter,
      invoicePrefix: body.invoicePrefix,
    },
  });
  return NextResponse.json({ settings });
}
