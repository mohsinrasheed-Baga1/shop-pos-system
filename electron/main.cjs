// Electron main process for Shop POS System
// Spawns the Next.js standalone server as an isolated child process (using
// Electron's bundled Node via ELECTRON_RUN_AS_NODE) and loads it in a window.
// This is more robust than require()-ing server.js in-process because the
// Next server gets its own clean cwd, env and module resolution (important
// for native modules like Prisma's query engine and sharp).
const {
  app,
  BrowserWindow,
  shell,
} = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { spawn } = require("child_process");

const PORT = 4783;
const HOST = "127.0.0.1";

const isDev = !app.isPackaged;
const serverDir = isDev
  ? path.join(__dirname, "..", ".next", "standalone")
  : path.join(process.resourcesPath, "server");

// Database lives in userData (writable, persists across versions)
const userData = app.getPath("userData");
const dbPath = path.join(userData, "pos.db");

// Copy the template DB (shipped in resources) on first launch
function ensureDatabase() {
  if (!fs.existsSync(dbPath)) {
    const template = path.join(serverDir, "pos.db");
    try {
      if (fs.existsSync(template)) {
        fs.copyFileSync(template, dbPath);
        console.log("[POS] Copied template database to", dbPath);
      } else {
        console.warn("[POS] Template DB not found at", template);
      }
    } catch (e) {
      console.error("[POS] Failed to copy template DB:", e);
    }
  } else {
    console.log("[POS] Using existing database at", dbPath);
  }
}

let mainWindow = null;
let serverProcess = null;

function startServer() {
  ensureDatabase();

  const serverJs = path.join(serverDir, "server.js");
  if (!fs.existsSync(serverJs)) {
    console.error("[POS] server.js not found at", serverJs);
    return false;
  }

  // Use Electron's own executable as a Node runtime (ELECTRON_RUN_AS_NODE=1)
  // so the standalone server runs as a plain Node script in its own process.
  // We renamed node_modules -> nm (in the packaged resources) to bypass
  // electron-builder's node_modules pruning in extraResources, so set
  // NODE_PATH so Node can still resolve modules from nm.
  const nmDir = path.join(serverDir, "nm");
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
    PORT: String(PORT),
    HOSTNAME: HOST,
    DATABASE_URL: `file:${dbPath}`,
    NEXTAUTH_SECRET:
      process.env.NEXTAUTH_SECRET || "pos-electron-shop-secret-secure-2024",
    NEXTAUTH_URL: `http://${HOST}:${PORT}`,
    NODE_ENV: "production",
    NODE_PATH: nmDir,
  };

  serverProcess = spawn(process.execPath, [serverJs], {
    cwd: serverDir,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  serverProcess.stdout.on("data", (d) =>
    process.stdout.write(`[server] ${d}`)
  );
  serverProcess.stderr.on("data", (d) =>
    process.stderr.write(`[server] ${d}`)
  );
  serverProcess.on("exit", (code) => {
    console.log("[POS] Server process exited with code", code);
    serverProcess = null;
  });

  return true;
}

function waitForServer(retries = 90) {
  return new Promise((resolve) => {
    let tries = 0;
    const check = () => {
      const req = http.get(
        { host: HOST, port: PORT, path: "/", timeout: 1000 },
        (res) => {
          res.destroy();
          resolve(true);
        }
      );
      req.on("error", () => {
        tries++;
        if (tries >= retries) resolve(false);
        else setTimeout(check, 400);
      });
      req.on("timeout", () => {
        req.destroy();
        tries++;
        if (tries >= retries) resolve(false);
        else setTimeout(check, 400);
      });
    };
    check();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 640,
    title: "Shop POS System",
    backgroundColor: "#f8fafc",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // Show window only after content loads (avoid white flash)
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.loadURL(`http://${HOST}:${PORT}/`);
}

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    startServer();
    const ok = await waitForServer();
    if (!ok) {
      console.error("[POS] Server did not start in time");
    }
    createWindow();
  });

  app.on("window-all-closed", () => {
    if (serverProcess) {
      try {
        serverProcess.kill();
      } catch {}
    }
    app.quit();
  });

  app.on("before-quit", () => {
    if (serverProcess) {
      try {
        serverProcess.kill();
      } catch {}
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

process.on("exit", () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
  }
});
