// Electron main process for Shop POS System
// Starts the Next.js standalone server and loads it in a BrowserWindow.
const {
  app,
  BrowserWindow,
  shell,
} = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");

const PORT = 4783;
const HOST = "127.0.0.1";

// Resolve the server directory (next standalone output)
const isDev = !app.isPackaged;
const serverDir = isDev
  ? path.join(__dirname, "..", ".next", "standalone")
  : path.join(process.resourcesPath, "server");

// Database location: store in userData so it persists and is writable
const userData = app.getPath("userData");
const dbPath = path.join(userData, "pos.db");

// Copy template DB on first launch (packaged only)
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
  }
}

// Environment for the Next server
function setupEnv() {
  process.env.PORT = String(PORT);
  process.env.HOSTNAME = HOST;
  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.NEXTAUTH_SECRET =
    process.env.NEXTAUTH_SECRET || "pos-electron-shop-secret-secure-2024";
  process.env.NEXTAUTH_URL = `http://${HOST}:${PORT}`;
}

let mainWindow = null;
let serverStarted = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 640,
    title: "Shop POS System",
    backgroundColor: "#f8fafc",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.loadURL(`http://${HOST}:${PORT}/`);
}

function waitForServer(retries = 60) {
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
        if (tries >= retries) {
          resolve(false);
        } else {
          setTimeout(check, 500);
        }
      });
      req.on("timeout", () => {
        req.destroy();
        tries++;
        if (tries >= retries) resolve(false);
        else setTimeout(check, 500);
      });
    };
    check();
  });
}

async function startServer() {
  setupEnv();
  ensureDatabase();

  if (!fs.existsSync(path.join(serverDir, "server.js"))) {
    console.error(
      "[POS] Next.js standalone server.js not found at",
      serverDir
    );
    return false;
  }

  try {
    // Set cwd so the server resolves .next and public correctly
    process.chdir(serverDir);
    // Require the standalone server (starts an HTTP server in-process)
    require(path.join(serverDir, "server.js"));
    console.log("[POS] Next server starting on port", PORT);
    const ok = await waitForServer();
    serverStarted = ok;
    return ok;
  } catch (e) {
    console.error("[POS] Failed to start server:", e);
    return false;
  }
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
    await startServer();
    createWindow();
  });

  app.on("window-all-closed", () => {
    app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
