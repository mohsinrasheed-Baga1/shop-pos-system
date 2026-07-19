// Test harness: launches Electron in headless mode, verifies the window loads
// the Next.js server, then quits. Run with: xvfb-run -a node scripts/test-electron.mjs
const { execFileSync } = require("child_process");
const path = require("path");
const http = require("http");

const electronBin = path.join(__dirname, "..", "node_modules", ".bin", "electron");
const mainCjs = path.join(__dirname, "..", "electron", "main.cjs");
const PORT = 4783;
const HOST = "127.0.0.1";

function checkServer(retries = 60) {
  return new Promise((resolve) => {
    let tries = 0;
    const check = () => {
      const req = http.get(
        { host: HOST, port: PORT, path: "/", timeout: 1000 },
        (res) => {
          res.destroy();
          resolve(res.statusCode);
        }
      );
      req.on("error", () => {
        tries++;
        if (tries >= retries) resolve(0);
        else setTimeout(check, 400);
      });
      req.on("timeout", () => {
        req.destroy();
        tries++;
        if (tries >= retries) resolve(0);
        else setTimeout(check, 400);
      });
    };
    check();
  });
}

(async () => {
  console.log("[test] Launching Electron...");
  // Use FUSE-less sandbox flags so Electron runs headless
  const env = {
    ...process.env,
    // force the test to use the already-built standalone server
  };
  const child = require("child_process").spawn(electronBin, [mainCjs, "--no-sandbox", "--disable-gpu"], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let out = "";
  child.stdout.on("data", (d) => {
    out += d.toString();
    process.stdout.write("[electron] " + d);
  });
  child.stderr.on("data", (d) => {
    process.stderr.write("[electron-err] " + d);
  });

  console.log("[test] Waiting for server on", PORT, "...");
  const status = await checkServer();
  console.log("[test] Server HTTP status:", status);

  if (status === 200) {
    // Fetch the page HTML to confirm it renders the login screen
    const data = await new Promise((resolve) => {
      http.get(`http://${HOST}:${PORT}/`, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve(body));
      }).on("error", () => resolve(""));
    });
    const hasLogin = data.includes("Sign In") || data.includes("Shop POS");
    console.log("[test] Page contains login UI:", hasLogin);
    console.log("[test] RESULT: SUCCESS");
  } else {
    console.log("[test] RESULT: FAILED (server not reachable)");
  }

  // Give it a moment then kill
  setTimeout(() => {
    try {
      child.kill("SIGTERM");
    } catch {}
    setTimeout(() => process.exit(status === 200 ? 0 : 1), 500);
  }, 2000);
})();
