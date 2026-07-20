import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// POST: return a sale (full refund). Restocks items, reverses card transaction.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const sale = await db.sale.findUnique({
    where: { id },
    include: { items: true, card: true },
  });
  if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  if (sale.status === "RETURNED") {
    return NextResponse.json({ error: "Already returned" }, { status: 400 });
  }

  // mark sale returned
  await db.sale.update({ where: { id }, data: { status: "RETURNED" } });

  // restock items
  for (const it of sale.items) {
    await db.product.update({
      where: { id: it.productId },
      data: { stock: { increment: it.quantity } },
    });
    await db.stockLog.create({
      data: {
        productId: it.productId,
        type: "RETURN",
        quantity: it.quantity,
        note: `Return ${sale.invoiceNo}`,
      },
    });
  }

  // reverse card transaction if linked
  if (sale.cardId && sale.card) {
    await db.customerCard.update({
      where: { id: sale.cardId },
      data: {
        balance: { increment: sale.total },
        totalPurchases: { decrement: sale.total },
      },
    });
    await db.cardTransaction.create({
      data: {
        cardId: sale.cardId,
        type: "PAYMENT",
        amount: sale.total,
        description: `Return refund ${sale.invoiceNo}`,
        saleId: sale.id,
      },
    });
  }

  const ret = await db.saleReturn.create({
    data: {
      saleId: id,
      userId: user.id,
      amount: sale.total,
      reason: body.reason || "Customer return",
      restocked: true,
    },
  });

  return NextResponse.json({ ok: true, return: ret });
}
