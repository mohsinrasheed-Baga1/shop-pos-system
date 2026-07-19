import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    // default settings
    await db.settings.upsert({
      where: { id: "shop" },
      update: {},
      create: {
        id: "shop",
        shopName: "My Shop",
        shopAddress: "",
        shopPhone: "",
        currency: "Rs",
        taxEnabled: false,
        defaultTax: 0,
        receiptFooter: "Thank you! Please come again.",
        invoicePrefix: "INV",
      },
    });

    // default admin
    const existingAdmin = await db.user.findUnique({
      where: { email: "admin@pos.local" },
    });
    if (!existingAdmin) {
      const hash = await bcrypt.hash("admin123", 10);
      await db.user.create({
        data: {
          email: "admin@pos.local",
          name: "Admin",
          password: hash,
          role: "ADMIN",
          active: true,
        },
      });
    }

    // default cashier
    const existingCashier = await db.user.findUnique({
      where: { email: "cashier@pos.local" },
    });
    if (!existingCashier) {
      const hash = await bcrypt.hash("cashier123", 10);
      await db.user.create({
        data: {
          email: "cashier@pos.local",
          name: "Cashier",
          password: hash,
          role: "CASHIER",
          active: true,
        },
      });
    }

    // default categories
    const cats = ["Groceries", "Beverages", "Household", "Cleaning", "Other"];
    for (const name of cats) {
      const exists = await db.category.findUnique({ where: { name } });
      if (!exists) {
        await db.category.create({ data: { name } });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
