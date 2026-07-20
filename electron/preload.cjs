// Preload script - exposes a small, safe surface to the renderer.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("posElectron", {
  version: "1.0.0",
  platform: process.platform,
  // Open a folder in the OS file explorer (used by Multi-Computer Sharing
  // to reveal the local data folder so the user can share it on the LAN).
  openPath: (p) => ipcRenderer.invoke("pos:open-path", p),
});
