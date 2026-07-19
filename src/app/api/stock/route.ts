import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// Stock adjustment (add stock) for a product
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role === "CASHIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const body = await req.json();
  const { productId, quantity, type = "PURCHASE", note } = body;
  if (!productId || !quantity) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  const product = await db.product.update({
    where: { id: productId },
    data: { stock: { increment: Number(quantity) } },
  });
  await db.stockLog.create({
    data: {
      productId,
      type,
      quantity: Number(quantity),
      note: note || "Stock addition",
    },
  });
  return NextResponse.json({ product });
}
