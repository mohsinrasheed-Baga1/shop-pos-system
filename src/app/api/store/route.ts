import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// GET: list products with store stock + recent store transactions
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { barcode: { contains: q } },
    ];
  }

  const products = await db.product.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      barcode: true,
      unit: true,
      stock: true,
      storeStock: true,
      minStock: true,
      costPrice: true,
      salePrice: true,
      active: true,
    },
  });

  const recentTxns = await db.storeTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { product: { select: { name: true, barcode: true } } },
  });

  return NextResponse.json({ products, transactions: recentTxns });
}

// POST: add incoming goods to main store, OR transfer store->shop
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role === "CASHIER") {
    return NextResponse.json({ error: "Manager or admin only" }, { status: 403 });
  }
  const body = await req.json();
  const { productId, type } = body;
  const quantity = Number(body.quantity);
  if (!productId || !quantity || quantity <= 0) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  if (!["INCOMING", "TRANSFER"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  if (type === "INCOMING") {
    await db.product.update({
      where: { id: productId },
      data: { storeStock: { increment: quantity } },
    });
    await db.storeTransaction.create({
      data: {
        productId,
        type: "INCOMING",
        quantity,
        note: body.note || "Goods received",
      },
    });
    return NextResponse.json({ ok: true, storeStock: product.storeStock + quantity });
  }

  if (type === "TRANSFER") {
    if (quantity > product.storeStock) {
      return NextResponse.json(
        { error: "Insufficient store stock", storeStock: product.storeStock },
        { status: 400 }
      );
    }
    await db.product.update({
      where: { id: productId },
      data: {
        storeStock: { decrement: quantity },
        stock: { increment: quantity },
      },
    });
    await db.storeTransaction.create({
      data: {
        productId,
        type: "TRANSFER",
        quantity: -quantity,
        note: body.note || "Transfer to shop",
      },
    });
    return NextResponse.json({
      ok: true,
      storeStock: product.storeStock - quantity,
      stock: product.stock + quantity,
    });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
