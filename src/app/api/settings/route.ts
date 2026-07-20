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
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const body = await req.json();
  const data: any = {
    shopName: body.shopName,
    subName: body.subName ?? null,
    logo: body.logo ?? null,
    shopAddress: body.shopAddress,
    shopPhone: body.shopPhone,
    currency: body.currency,
    taxEnabled: body.taxEnabled === true,
    defaultTax: Number(body.defaultTax) || 0,
    receiptFooter: body.receiptFooter,
    invoicePrefix: body.invoicePrefix,
    printerWidth: Number(body.printerWidth) === 80 ? 80 : 58,
  };
  const settings = await db.settings.upsert({
    where: { id: "shop" },
    update: data,
    create: { id: "shop", ...data },
  });
  return NextResponse.json({ settings });
}
