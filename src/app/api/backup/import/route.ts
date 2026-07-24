import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const dbUrl = process.env.DATABASE_URL || "";
    const dbPath = dbUrl.replace("file:", "");

    // Safety backup first
    const backupDir = path.join(os.homedir(), "ShopPOSBackups");
    await fs.mkdir(backupDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const safetyPath = path.join(backupDir, `pre-import-${ts}.db`);
    try {
      await fs.copyFile(dbPath, safetyPath);
    } catch {}

    // Write uploaded file as new DB
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(dbPath, buffer);

    return NextResponse.json({
      ok: true,
      message: "Database imported. Please restart the app.",
      safetyBackup: `pre-import-${ts}.db`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
