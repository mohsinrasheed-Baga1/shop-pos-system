"use client";

import * as React from "react";
import {
  Receipt,
  Search,
  Eye,
  Calendar,
  TrendingUp,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatMoney } from "@/lib/pos-utils";
import { Receipt as ReceiptComponent } from "@/components/pos/receipt";
import type { Sale } from "@/types";

export function SalesView() {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [settings, setSettings] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [todayOnly, setTodayOnly] = React.useState(true);
  const [selected, setSelected] = React.useState<Sale | null>(null);
  const [receiptOpen, setReceiptOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (todayOnly) params.set("today", "true");
      params.set("limit", "200");
      const res = await fetch(`/api/sales?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      let list: Sale[] = data.sales || [];
      if (q) {
        list = list.filter(
          (s) =>
            s.invoiceNo.toLowerCase().includes(q.toLowerCase()) ||
            s.customerName?.toLowerCase().includes(q.toLowerCase())
        );
      }
      setSales(list);
    } catch {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, [todayOnly, q]);

  React.useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const totalRevenue = sales.reduce((s, x) => s + x.total, 0);
  const totalItems = sales.reduce(
    (s, x) => s + x.items.reduce((c, i) => c + i.quantity, 0),
    0
  );
  const currency = settings?.currency || "Rs";

  function viewReceipt(sale: Sale) {
    setSelected(sale);
    setReceiptOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            Sales History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record and details of all invoices
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="border-emerald-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Sales</div>
              <div className="text-lg font-bold text-emerald-700">
                {loading ? "..." : formatMoney(totalRevenue, currency)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Invoice Count</div>
              <div className="text-lg font-bold">
                {loading ? "..." : sales.length}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Items Sold</div>
              <div className="text-lg font-bold">
                {loading ? "..." : totalItems}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Invoice number or customer name..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant={todayOnly ? "default" : "outline"}
            className={todayOnly ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            onClick={() => setTodayOnly(true)}
          >
            <Calendar className="w-4 h-4 mr-2" /> Today
          </Button>
          <Button
            variant={!todayOnly ? "default" : "outline"}
            className={!todayOnly ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            onClick={() => setTodayOnly(false)}
          >
            All
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sales.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
              No sales found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">
                        {s.invoiceNo}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(s.createdAt).toLocaleString("en-US", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell>{s.customerName || "Walk-in"}</TableCell>
                      <TableCell className="text-xs">{s.user?.name || "-"}</TableCell>
                      <TableCell className="text-right">
                        {s.items.length}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-700">
                        {formatMoney(s.total, currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {s.paymentMethod === "CASH"
                            ? "Cash"
                            : s.paymentMethod === "CARD"
                            ? "Card"
                            : "Mobile"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => viewReceipt(s)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ReceiptComponent
        sale={selected}
        settings={settings}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
      />
    </div>
  );
}
