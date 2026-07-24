"use client";

import * as React from "react";

type ScanCallback = (code: string) => void;

interface ScanOptions {
  minLength?: number;
  maxGap?: number;
}

// Singleton: one document-level listener shared by all subscribers.
const subscribers = new Set<ScanCallback>();
let listenerAttached = false;
let buffer = "";
let lastTime = 0;
let lastScanCode = "";
let lastScanTime = 0;

// Cooldown: prevent the same barcode from firing twice within 800ms
const SCAN_COOLDOWN_MS = 800;

function fireScan(code: string) {
  const now = Date.now();
  // Dedup: if the exact same code was scanned very recently, ignore
  if (code === lastScanCode && now - lastScanTime < SCAN_COOLDOWN_MS) {
    return;
  }
  lastScanCode = code;
  lastScanTime = now;

  // Clear any focused input that received scanner chars (e.g. search box)
  const active = document.activeElement;
  if (
    active &&
    active.tagName === "INPUT" &&
    active.getAttribute("data-barcode-input") !== "true"
  ) {
    (active as HTMLInputElement).value = "";
    active.dispatchEvent(new Event("input", { bubbles: true }));
  }

  subscribers.forEach((cb) => {
    try {
      cb(code);
    } catch {}
  });
}

function handleKeyDown(e: KeyboardEvent) {
  // Ignore modifier combos
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  // Check if a text input with data-barcode-input is focused
  const active = document.activeElement;
  if (
    active &&
    active.tagName === "INPUT" &&
    active.getAttribute("data-barcode-input") === "true"
  ) {
    return;
  }

  const now = Date.now();
  if (now - lastTime > 100) {
    buffer = "";
  }
  lastTime = now;

  if (e.key === "Enter") {
    if (buffer.length >= 4) {
      fireScan(buffer);
      e.preventDefault();
    }
    buffer = "";
    return;
  }

  // Space bar = Enter for scanners (some scanners send Space instead of Enter)
  if (e.key === " " && buffer.length >= 4) {
    fireScan(buffer);
    e.preventDefault();
    buffer = "";
    return;
  }

  if (e.key.length === 1) {
    buffer += e.key;
  }
}

function attachListener() {
  if (listenerAttached) return;
  document.addEventListener("keydown", handleKeyDown, true);
  listenerAttached = true;
}

function detachListener() {
  if (!listenerAttached) return;
  if (subscribers.size === 0) {
    document.removeEventListener("keydown", handleKeyDown, true);
    listenerAttached = false;
  }
}

export function useBarcodeScanner(
  onScan: ScanCallback,
  options: ScanOptions = {}
) {
  const { minLength = 4, maxGap = 100 } = options;
  const callbackRef = React.useRef(onScan);
  React.useEffect(() => {
    callbackRef.current = onScan;
  }, [onScan]);

  React.useEffect(() => {
    const handler: ScanCallback = (code) => {
      if (code.length >= minLength) {
        callbackRef.current(code);
      }
    };
    subscribers.add(handler);
    attachListener();
    return () => {
      subscribers.delete(handler);
      detachListener();
    };
  }, [minLength]);
}
