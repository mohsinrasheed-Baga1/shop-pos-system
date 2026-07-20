import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Set or update the backup/restore password (admin only)
// body: { action: "set"|"update"|"verify", password?, currentPassword? }
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const body = await req.json();
  const action = body.action || "set";

  const settings = await db.settings.findUnique({ where: { id: "shop" } });

  if (action === "verify") {
    if (!settings?.backupPasswordHash) {
      return NextResponse.json({ set: false });
    }
    const ok = await bcrypt.compare(body.password || "", settings.backupPasswordHash);
    return NextResponse.json({ set: true, valid: ok });
  }

  if (action === "generate") {
    // generate a random 8-char password
    const generated = crypto.randomBytes(4).toString("hex").toUpperCase();
    const hash = await bcrypt.hash(generated, 10);
    await db.settings.upsert({
      where: { id: "shop" },
      update: { backupPasswordHash: hash },
      create: { id: "shop", backupPasswordHash: hash },
    });
    return NextResponse.json({ ok: true, generated });
  }

  if (action === "set" || action === "update") {
    if (action === "update" && settings?.backupPasswordHash) {
      const ok = await bcrypt.compare(body.currentPassword || "", settings.backupPasswordHash);
      if (!ok) {
        return NextResponse.json({ error: "Current backup password incorrect" }, { status: 400 });
      }
    }
    if (!body.password || body.password.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 chars" }, { status: 400 });
    }
    const hash = await bcrypt.hash(body.password, 10);
    await db.settings.upsert({
      where: { id: "shop" },
      update: { backupPasswordHash: hash },
      create: { id: "shop", backupPasswordHash: hash },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
