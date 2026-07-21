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

  // Check if a text input with data-barcode-input is focused
  // (e.g. product add dialog barcode field — scanner should type into it, not fire global)
  const active = document.activeElement;
  if (
    active &&
    active.tagName === "INPUT" &&
    active.getAttribute("data-barcode-input") === "true"
  ) {
    // Scanner types into the field directly, don't fire global callback
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
      // Clear any focused input that received scanner chars (e.g. search box)
      const active = document.activeElement;
      if (
        active &&
        active.tagName === "INPUT" &&
        active.getAttribute("data-barcode-input") !== "true"
      ) {
        (active as HTMLInputElement).value = "";
        // trigger input event so React state updates
        active.dispatchEvent(new Event("input", { bubbles: true }));
      }
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
