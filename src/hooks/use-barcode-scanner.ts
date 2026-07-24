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
let lastKeyTime = 0;

// Fire lock: prevent ANY scan from firing while a previous scan is being processed
let scanLock = false;
const SCAN_LOCK_MS = 1000;

function fireScan(code: string) {
  // Absolute lock: if a scan was fired recently, ignore ALL subsequent scans
  if (scanLock) {
    return;
  }
  scanLock = true;
  setTimeout(() => { scanLock = false; }, SCAN_LOCK_MS);

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
  if (now - lastKeyTime > 100) {
    buffer = "";
  }
  lastKeyTime = now;

  // ONLY Enter triggers a scan — Space is removed to prevent double-fire
  if (e.key === "Enter") {
    if (buffer.length >= 4) {
      fireScan(buffer);
      e.preventDefault();
    }
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
  const { minLength = 4 } = options;
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
