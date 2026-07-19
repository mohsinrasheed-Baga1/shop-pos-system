# Task 5 — Reports/Dashboard view (full-stack-developer)

## Work Log
- Read worklog.md (Task 1 foundation) and verified API contracts:
  - GET /api/reports?range=today|week|month|all -> full report object
  - GET /api/settings -> { settings: { currency, shopName, ... } }
- Overwrote the stub at `src/components/pos/views/reports-view.tsx` with a full client component.
- Implemented:
  - Range selector Tabs (آج / ہفتہ / مہینہ / تمام), default = today, switching refetches.
  - Refresh button (RefreshCw, spin animation while refreshing).
  - 4 KPI cards (Wallet/کل فروخت, TrendingUp/منافع, Receipt/فروخت کی تعداد, Percent/ٹیکس) with emerald accent strip + soft icon backgrounds. Subtitles show cost / margin / invoice count.
  - 4 mini-stats row: productCount, categoryCount, topProducts length, lowStock count (amber when > 0).
  - Hourly bar chart (recharts) titled "آج کی گھنطہ وار فروخت" with emerald gradient fill, custom Tooltip formatting in currency, emerald palette Cells, RTL-safe wrapper (dir=ltr on chart container).
  - Top products table (top 8) with rank Badge, name, qty Badge, revenue in emerald. Scrollable (max-h-80, custom scrollbar).
  - Low stock table: name, category, current stock (red if 0, amber if low), status Badge (ختم/کم/کافی). Scrollable max-h-96.
  - Quick summary card: revenue, cost, tax, net profit, plus avg sale per invoice tile.
  - Loading skeletons (Skeleton) for KPIs, chart, tables, summary.
  - Empty states for chart / top products / low stock with icons + Urdu copy.
  - Custom scrollbar styles injected via styled-jsx global.
- Conventions followed:
  - "use client", relative URLs only (`/api/reports?range=...`, `/api/settings`).
  - import { toast } from "sonner" for refresh + error toasts.
  - import { formatMoney } from "@/lib/pos-utils" (passes currency from settings).
  - import type { Product } from "@/types" for lowStock typing.
  - shadcn/ui: Card, CardHeader, CardTitle, CardContent, CardDescription, Button, Tabs/TabsList/TabsTrigger, Badge, Skeleton, Table*.
  - Emerald color scheme only (NO indigo / blue).
  - RTL layout via dir="rtl" root, responsive grid (1 col mobile → 4 col KPIs on lg, 3+2 col chart/top, 3+2 col low stock/summary).
- Lint check: no issues introduced by this file.

## Stage Summary
- Reports/Dashboard view is complete and production-ready.
- Fetches live data from /api/reports (range-aware) and /api/settings (currency).
- Polished emerald UI in Urdu RTL with KPIs, hourly chart, top products, low stock alerts, and profit summary.
- All interactions (range change, refresh) provide feedback via toasts and skeletons.
- Default range = today as required.
