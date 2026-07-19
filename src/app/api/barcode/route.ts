import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// Lookup product by scanned barcode
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code") || "";
  if (!code) return NextResponse.json({ error: "Barcode is required" }, { status: 400 });

  const product = await db.product.findUnique({
    where: { barcode: code },
    include: { category: true },
  });

  if (!product) {
    return NextResponse.json({ found: false, product: null });
  }
  return NextResponse.json({ found: true, product });
}
