import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import bcrypt from "bcryptjs";

// Remove transactional data (sales, saleItems, returns, stockLogs, cardTransactions,
// storeTransactions) but KEEP products, categories, users, settings, customer cards.
// Requires backup password.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const body = await req.json();
  const settings = await db.settings.findUnique({ where: { id: "shop" } });
  if (!settings?.backupPasswordHash) {
    return NextResponse.json({ error: "Backup password not set. Set it first in Settings." }, { status: 400 });
  }
  const ok = await bcrypt.compare(body.password || "", settings.backupPasswordHash);
  if (!ok) {
    return NextResponse.json({ error: "Incorrect backup password" }, { status: 403 });
  }

  // delete in dependency order
  await db.saleReturn.deleteMany();
  await db.saleItem.deleteMany();
  await db.sale.deleteMany();
  await db.stockLog.deleteMany();
  await db.cardTransaction.deleteMany();
  await db.storeTransaction.deleteMany();

  // reset card balances/totals
  await db.customerCard.updateMany({
    data: { balance: 0, totalPurchases: 0, totalPaid: 0 },
  });

  return NextResponse.json({ ok: true, message: "All transactional data removed. Products and cards preserved." });
}
