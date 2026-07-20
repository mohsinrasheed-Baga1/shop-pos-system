import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prevStock = existing.stock;
  const newStock = Number(body.stock);
  const stockDiff = newStock - prevStock;

  const product = await db.product.update({
    where: { id },
    data: {
      name: body.name,
      categoryId: body.categoryId || null,
      vendorId: body.vendorId || null,
      costPrice: Number(body.costPrice) || 0,
      salePrice: Number(body.salePrice) || 0,
      wholesalePrice: Number(body.wholesalePrice) || 0,
      unit: body.unit || "piece",
      stock: newStock,
      storeStock: Number(body.storeStock) ?? prevStock,
      minStock: Number(body.minStock) || 0,
      taxRate: Number(body.taxRate) || 0,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      manufacturingDate: body.manufacturingDate ? new Date(body.manufacturingDate) : null,
      hasBarcode: body.hasBarcode !== false,
      image: body.image || null,
      active: body.active !== false,
    },
    include: { category: true, vendor: true },
  });

  if (stockDiff !== 0) {
    await db.stockLog.create({
      data: {
        productId: product.id,
        type: "ADJUSTMENT",
        quantity: stockDiff,
        note: body.stockNote || "Stock adjustment",
      },
    });
  }

  return NextResponse.json({ product });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "CASHIER") {
    return NextResponse.json({ error: "Admin or manager only" }, { status: 403 });
  }
  const { id } = await params;
  await db.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
