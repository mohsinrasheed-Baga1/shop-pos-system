// Global type declarations for the Electron preload bridge exposed via
// `window.posElectron`. The actual implementation lives in
// `electron/preload.cjs`.
export {};

declare global {
  interface Window {
    posElectron?: {
      version: string;
      platform: string;
      /**
       * Open a folder/file in the OS file explorer.
       * Returns { ok: boolean, opened?: string, error?: string }.
       */
      openPath?: (p: string) => Promise<{ ok: boolean; opened?: string; error?: string }>;
    };
  }
}
