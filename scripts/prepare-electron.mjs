// Prepares the Electron app resources:
// 1. Copies the Next.js standalone build into dist-electron-server/
// 2. Generates a fresh empty pos.db (with schema) as the template DB
import { existsSync, rmSync, cpSync, mkdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const root = process.cwd();
const standaloneSrc = join(root, ".next", "standalone");
const serverDest = join(root, "dist-electron-server");

console.log("[prepare-electron] Copying Next.js standalone build...");
if (!existsSync(standaloneSrc)) {
  console.error("[prepare-electron] ERROR: .next/standalone not found. Run 'next build' first.");
  process.exit(1);
}

// Clean destination
if (existsSync(serverDest)) rmSync(serverDest, { recursive: true, force: true });
mkdirSync(serverDest, { recursive: true });

// Copy standalone (server.js + node_modules + .next + public)
cpSync(standaloneSrc, serverDest, { recursive: true });
console.log("[prepare-electron] Standalone copied to", serverDest);

// Generate a fresh template database with the Prisma schema (no data)
console.log("[prepare-electron] Generating template pos.db...");
const templateDb = join(serverDest, "pos.db");
if (existsSync(templateDb)) rmSync(templateDb, { force: true });

try {
  execSync(`DATABASE_URL="file:${templateDb}" bunx prisma db push --skip-generate`, {
    stdio: "inherit",
    cwd: root,
  });
  console.log("[prepare-electron] Template DB created at", templateDb);
} catch (e) {
  console.error("[prepare-electron] Failed to create template DB:", e.message);
  process.exit(1);
}

// Verify server.js exists
const serverJs = join(serverDest, "server.js");
if (!existsSync(serverJs)) {
  console.error("[prepare-electron] ERROR: server.js missing in standalone output!");
  process.exit(1);
}

console.log("[prepare-electron] Done. Electron resources ready.");
