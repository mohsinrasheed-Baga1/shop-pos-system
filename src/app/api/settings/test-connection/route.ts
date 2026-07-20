import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import fs from "fs";
import os from "os";
import path from "path";

/**
 * Test whether a network database path is reachable.
 *
 * Body: { path: string } — e.g. "\\HOST\ShopPOS\pos.db" or a directory path.
 *
 * Strategy:
 *   - If the path points to a file, check `fs.accessSync` for R/W.
 *   - If the path points to a directory, list its contents to confirm
 *     we can actually read it (a directory may be visible but not
 *     readable).
 *   - If the file doesn't exist but the parent directory is writable,
 *     report that the file will be created on first connect (host
 *     creates it; client must wait).
 *
 * Response: { ok: boolean, exists?: boolean, type?: "file"|"dir", error?: string }
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json();
  const rawPath: unknown = body.path;
  if (typeof rawPath !== "string" || !rawPath.trim()) {
    return NextResponse.json(
      { ok: false, error: "Path is required" },
      { status: 400 }
    );
  }
  const target = rawPath.replace(/\\\\/g, "\\").trim();

  // Quick sanity check: network paths must look like a UNC path or a POSIX
  // absolute path. Reject obvious junk to give a better error.
  const isUNC = target.startsWith("\\\\");
  const isPosix = target.startsWith("/") || /^[A-Za-z]:[\\/]/.test(target);
  if (!isUNC && !isPosix) {
    return NextResponse.json({
      ok: false,
      error:
        "Path must be a network UNC path (\\\\HOST\\Share\\pos.db) or an absolute path.",
    });
  }

  let stats: fs.Stats;
  try {
    stats = fs.statSync(target);
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException)?.code;
    // ENOENT: file doesn't exist — but parent dir might be writable
    if (code === "ENOENT") {
      const parent = path.dirname(target);
      try {
        fs.accessSync(parent, fs.constants.R_OK | fs.constants.W_OK);
        return NextResponse.json({
          ok: true,
          exists: false,
          type: "file",
          note: "Parent folder is reachable. The DB file will be created when host mode is enabled.",
        });
      } catch {
        return NextResponse.json({
          ok: false,
          exists: false,
          error: `Cannot reach parent folder: ${parent}`,
        });
      }
    }
    // EACCES / EPERM → permission denied
    if (code === "EACCES" || code === "EPERM") {
      return NextResponse.json({
        ok: false,
        error: "Permission denied. Check that the folder is shared with read/write access.",
      });
    }
    // ENOTDIR, EHOSTUNREACH etc.
    return NextResponse.json({
      ok: false,
      error: `Could not access path: ${(e as Error)?.message || String(e)}`,
    });
  }

  if (stats.isFile()) {
    try {
      fs.accessSync(target, fs.constants.R_OK | fs.constants.W_OK);
      const size = stats.size;
      return NextResponse.json({
        ok: true,
        exists: true,
        type: "file",
        size,
      });
    } catch {
      return NextResponse.json({
        ok: false,
        exists: true,
        type: "file",
        error: "File exists but is not writable/readable. Check share permissions.",
      });
    }
  }

  if (stats.isDirectory()) {
    // Confirm we can actually list the directory contents
    try {
      fs.readdirSync(target);
      return NextResponse.json({
        ok: true,
        exists: true,
        type: "dir",
        note: "Folder is accessible. Provide the full path to the .db file to connect.",
      });
    } catch (e: unknown) {
      return NextResponse.json({
        ok: false,
        exists: true,
        type: "dir",
        error: `Folder exists but cannot be read: ${(e as Error)?.message || ""}`,
      });
    }
  }

  return NextResponse.json({
    ok: false,
    error: "Path is neither a file nor a directory.",
  });
}

/**
 * Convenience: also expose the host computer name so the UI can suggest a
 * network path for the user to share with other computers.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let hostname: string | null = null;
  try {
    hostname = os.hostname();
  } catch {
    hostname = null;
  }
  return NextResponse.json({ hostname });
}
