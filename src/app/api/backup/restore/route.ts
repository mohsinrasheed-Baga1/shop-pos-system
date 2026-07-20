import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import bcrypt from "bcryptjs";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

// Restore database from a backup file (replaces current DB).
// Requires backup password. Accepts { password, backupName } where backupName
// is a file in ~/ShopPOSBackups/. The app must be restarted after restore.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const body = await req.json();
  const settings = await db.settings.findUnique({ where: { id: "shop" } });
  if (!settings?.backupPasswordHash) {
    return NextResponse.json({ error: "Backup password not set" }, { status: 400 });
  }
  const ok = await bcrypt.compare(body.password || "", settings.backupPasswordHash);
  if (!ok) {
    return NextResponse.json({ error: "Incorrect backup password" }, { status: 403 });
  }

  const backupName = body.backupName;
  if (!backupName) {
    return NextResponse.json({ error: "Backup name required" }, { status: 400 });
  }

  const backupDir = path.join(os.homedir(), "ShopPOSBackups");
  const backupPath = path.join(backupDir, backupName);
  try {
    await fs.access(backupPath);
  } catch {
    return NextResponse.json({ error: "Backup file not found" }, { status: 404 });
  }

  const dbUrl = process.env.DATABASE_URL || "";
  const dbPath = dbUrl.replace("file:", "");

  // create a pre-restore safety backup
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const safetyPath = path.join(backupDir, `pre-restore-${ts}.db`);
  try {
    await fs.copyFile(dbPath, safetyPath);
  } catch {}

  // overwrite current DB with the selected backup
  try {
    await fs.copyFile(backupPath, dbPath);
  } catch (e: any) {
    return NextResponse.json({ error: "Restore failed: " + e.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Database restored. Please restart the app for changes to take effect.",
    safetyBackup: `pre-restore-${ts}.db`,
  });
}
