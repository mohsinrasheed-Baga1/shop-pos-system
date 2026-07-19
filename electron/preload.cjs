// Preload script - minimal, no privileged APIs exposed
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("posElectron", {
  version: "1.0.0",
  platform: process.platform,
});
