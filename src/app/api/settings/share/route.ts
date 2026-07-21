import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import fs from "fs";
import os from "os";
import path from "path";

// Path to a small config file the Electron main process reads on startup
// to decide which SQLite database to bind to (local AppData vs. network
// share). Lives in the user's home directory so it persists across restarts
// and survives app reinstalls.
const CONFIG_PATH = path.join(os.homedir(), ".shoppos-config.json");

export type ShareMode = "local" | "host" | "client";

function isValidMode(m: unknown): m is ShareMode {
  return m === "local" || m === "host" || m === "client";
}

/**
 * Persist the multi-computer sharing config:
 *   1. Save shareMode + dbNetworkPath in the Settings table (so the UI
 *      shows the current state on reload).
 *   2. Write ~/.shoppos-config.json with the same values — this is what
 *      the Electron main process reads at startup to decide which
 *      DATABASE_URL to pass to the Next.js server.
 *
 * Body: { shareMode: "local" | "host" | "client", dbNetworkPath?: string }
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const body = await req.json();
  const mode: unknown = body.shareMode;
  if (!isValidMode(mode)) {
    return NextResponse.json(
      { error: "shareMode must be 'local', 'host' or 'client'" },
      { status: 400 }
    );
  }

  // For client mode, dbNetworkPath is required. For host/local, we null it out
  // so the local DB is used.
  let networkPath: string | null = null;
  if (mode === "client") {
    const raw =
      typeof body.dbNetworkPath === "string" ? body.dbNetworkPath.trim() : "";
    if (!raw) {
      return NextResponse.json(
        { error: "dbNetworkPath is required for client mode" },
        { status: 400 }
      );
    }
    // Normalize backslashes (JSON-encoded Windows paths may arrive doubled)
    networkPath = raw.replace(/\\\\/g, "\\");
  }

  // 1. Persist to Settings table
  await db.settings.upsert({
    where: { id: "shop" },
    update: { shareMode: mode, dbNetworkPath: networkPath },
    create: { id: "shop", shareMode: mode, dbNetworkPath: networkPath },
  });

  // 2. Write the config file that Electron reads on startup
  const config = { shareMode: mode, dbNetworkPath: networkPath };
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
  } catch (e) {
    console.error("[share] Failed to write config file:", e);
    return NextResponse.json(
      { error: "Could not write config file", ok: false },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    shareMode: mode,
    dbNetworkPath: networkPath,
    configPath: CONFIG_PATH,
  });
}

/**
 * GET returns the current share config (from DB, falling back to the file if
 * the DB row hasn't been created yet — e.g. fresh install).
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let shareMode: ShareMode = "local";
  let dbNetworkPath: string | null = null;

  try {
    const s = await db.settings.findUnique({ where: { id: "shop" } });
    if (s) {
      shareMode = (s.shareMode as ShareMode) || "local";
      dbNetworkPath = s.dbNetworkPath ?? null;
    }
  } catch {
    // DB not ready yet — fall through to file-based read
  }

  // If DB doesn't have it, try the config file (Electron writes it at startup)
  if (shareMode === "local" && fs.existsSync(CONFIG_PATH)) {
    try {
      const raw = fs.readFileSync(CONFIG_PATH, "utf8");
      const parsed = JSON.parse(raw);
      if (isValidMode(parsed.shareMode)) shareMode = parsed.shareMode;
      if (typeof parsed.dbNetworkPath === "string") {
        dbNetworkPath = parsed.dbNetworkPath;
      }
    } catch {
      // ignore malformed config file
    }
  }

  // Best-effort: include the local computer name so the UI can show the
  // expected network path (\\HOSTNAME\ShopPOS\pos.db) for host mode.
  let hostname: string | null = null;
  try {
    hostname = os.hostname();
  } catch {
    hostname = null;
  }

  // Local DB path (parsed from DATABASE_URL which Electron sets to
  // "file:<path>"). Used by the "Open Data Folder" button so the user can
  // reveal the folder they need to share on the LAN.
  let localDbPath: string | null = null;
  try {
    const url = process.env.DATABASE_URL;
    if (typeof url === "string" && url.startsWith("file:")) {
      localDbPath = url.slice("file:".length);
    } else if (typeof url === "string") {
      localDbPath = url;
    }
  } catch {
    localDbPath = null;
  }

  return NextResponse.json({
    shareMode,
    dbNetworkPath,
    hostname,
    localDbPath,
    configPath: CONFIG_PATH,
  });
}
