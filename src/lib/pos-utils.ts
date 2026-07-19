// Utility helpers for POS

export function formatMoney(amount: number, currency = "Rs"): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `${currency} ${n.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(n: number, digits = 2): string {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/**
 * Generate an internal barcode for loose items (sugar, ghee, etc.)
 * Format: 2 + 12 digits (13 total) that are EAN-13 valid with checksum.
 */
export function generateInternalBarcode(): string {
  // start with 2 (internal use prefix, in-store)
  let base = "2";
  for (let i = 0; i < 11; i++) {
    base += Math.floor(Math.random() * 10).toString();
  }
  // EAN-13 checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = parseInt(base[i], 10);
    sum += i % 2 === 0 ? d : d * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return base + check.toString();
}

export function generateInvoiceNo(prefix = "INV", count = 0): string {
  const d = new Date();
  const ymd =
    d.getFullYear().toString() +
    (d.getMonth() + 1).toString().padStart(2, "0") +
    d.getDate().toString().padStart(2, "0");
  const seq = (count + 1).toString().padStart(4, "0");
  return `${prefix}-${ymd}-${seq}`;
}

export function isLooseUnit(unit: string): boolean {
  return ["kg", "gram", "litre", "ml", "metre", "feet"].includes(unit);
}

export function unitLabel(unit: string): string {
  const map: Record<string, string> = {
    piece: "پیس",
    kg: "کلو",
    gram: "گرام",
    litre: "لیٹر",
    ml: "ملی لیٹر",
    dozen: "درجن",
    metre: "میٹر",
    feet: "فٹ",
  };
  return map[unit] || unit;
}

export function todayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
