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

function handleKeyDown(e: KeyboardEvent) {
  // Ignore modifier combos
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  // Check if a text input is focused (skip global dispatch — scanner types into the field)
  const active = document.activeElement;
  if (
    active &&
    (active.tagName === "INPUT" ||
      active.tagName === "TEXTAREA" ||
      active.tagName === "SELECT" ||
      (active as HTMLElement).isContentEditable)
  ) {
    // But if the input has data-barcode-input, the scanner should still type into it
    // and we DON'T fire the global callback. Let the Enter key submit naturally.
    // Skip global dispatch entirely when an input is focused.
    return;
  }

  const now = Date.now();
  if (now - lastTime > 100) {
    // gap too long — start fresh
    buffer = "";
  }
  lastTime = now;

  if (e.key === "Enter") {
    if (buffer.length >= 4) {
      // Fire to all subscribers
      const code = buffer;
      subscribers.forEach((cb) => {
        try {
          cb(code);
        } catch {}
      });
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
