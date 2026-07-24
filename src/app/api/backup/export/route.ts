import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUrl = process.env.DATABASE_URL || "";
  const dbPath = dbUrl.replace("file:", "");

  try {
    const data = await fs.readFile(dbPath);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `shop-pos-backup-${date}.db`;

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": data.length.toString(),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
