# Task 6-b — Settings View

## Summary
Built the full admin-only **Shop Settings view** at `src/components/pos/views/settings-view.tsx` (overwrote stub). It is a Next.js client component in Urdu with full RTL layout, emerald color scheme, and shadcn/ui.

## What was built
- **Fetch + controlled form** wired to `GET /api/settings` and `PUT /api/settings` (relative URLs, `cache: "no-store"`). Form state: `shopName, shopAddress, shopPhone, currency, taxEnabled, defaultTax, receiptFooter, invoicePrefix` with safe defaults (`Rs` / `INV` / tax off).
- **Submit** normalizes body (trim strings, defaults empties, forces `defaultTax=0` when tax disabled), shows `Loader2` spinner + "محفوظ ہو رہا ہے…" while saving, then success toast `سیٹنگز محفوظ ہو گئیں` or error toast with server message.
- **Loading skeleton** while fetching — skeleton top cards + 8-field form grid skeleton.
- **Page header** — emerald Store icon tile + Urdu title/subtitle.
- **Info card (emerald-tinted)** at top explaining these settings apply across POS (receipts, invoices, tax) with three pill badges.
- **Demo credentials info card (amber-tinted, read-only)** listing `admin@pos.local / admin123` and `cashier@pos.local / cashier123` in two columns on sm+.
- **Form card** with three sections separated by `Separator`:
  1. Shop info: shopName (full width), shopAddress Textarea (full width), shopPhone + currency (2-col on lg).
  2. Tax: `Switch` in emerald panel; conditional `defaultTax` number input (0–100, 0.01 step) only visible when tax enabled.
  3. Receipt & invoice: receiptFooter Textarea (full width) + invoicePrefix Input (uppercase LTR).
- **Reset + Save** buttons in responsive action row (stacked on mobile, right-aligned on sm+).
- **Responsive**: single column on mobile, 2-column grid on `lg`. Each label prefixed with emerald lucide icon; LTR inputs for phone/currency/invoicePrefix with right-aligned text.

## Conventions followed
- `"use client"`, `import { toast } from "sonner"`, relative fetch URLs only.
- shadcn/ui: Card, CardHeader, CardTitle, CardContent, CardDescription, Button, Input, Label, Textarea, Switch, Separator, Skeleton.
- `import type { Settings } from "@/types"`.
- Emerald theme only (no indigo/blue), RTL Urdu throughout.
- `bun run lint` clean. No TS errors in `settings-view.tsx`.
- Appended a new section to `/home/z/my-project/worklog.md` (Task ID 6-b).

## Notes
- `dev.log` shows pre-existing module-not-found errors for `scanner-view`, `pos-view`, `products-view`, `sales-view` — those belong to parallel subagents (Task IDs 2–5), not this task. The settings view itself compiles and lints clean.
