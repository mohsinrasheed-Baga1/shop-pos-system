import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

const backupDir = () => path.join(os.homedir(), "ShopPOSBackups");

// GET — list existing backup files in ~/ShopPOSBackups/ (admin only)
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  try {
    await fs.mkdir(backupDir(), { recursive: true });
    const entries = await fs.readdir(backupDir());
    const files = await Promise.all(
      entries
        .filter((f) => f.endsWith(".db"))
        .map(async (f) => {
          const full = path.join(backupDir(), f);
          const stat = await fs.stat(full);
          return {
            name: f,
            size: stat.size,
            mtime: stat.mtime.toISOString(),
          };
        })
    );
    files.sort((a, b) => (a.mtime < b.mtime ? 1 : -1));
    return NextResponse.json({ backups: files });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

// POST — create a new backup by copying the current SQLite DB file
// into ~/ShopPOSBackups/backup-<timestamp>.db (admin only)
export async function POST() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  try {
    await fs.mkdir(backupDir(), { recursive: true });
    const dbUrl = process.env.DATABASE_URL || "";
    const dbPath = dbUrl.replace("file:", "");
    if (!dbPath) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const name = `backup-${ts}.db`;
    const dest = path.join(backupDir(), name);
    await fs.copyFile(dbPath, dest);
    const stat = await fs.stat(dest);
    return NextResponse.json({
      ok: true,
      backup: {
        name,
        size: stat.size,
        mtime: stat.mtime.toISOString(),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Backup failed" }, { status: 500 });
  }
}
