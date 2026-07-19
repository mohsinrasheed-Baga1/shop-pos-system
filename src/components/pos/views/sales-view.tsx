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
  Printer,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
      toast.error("فروخت لوڈ نہیں ہوئی");
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
            فروخت کی تاریخ
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            تمام بلوں کا ریکارڈ اور تفصیلات
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCw className="w-4 h-4 ml-2" /> تازہ
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
              <div className="text-xs text-muted-foreground">کل فروخت</div>
              <div className="text-lg font-bold text-emerald-700" dir="ltr">
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
              <div className="text-xs text-muted-foreground">بلوں کی تعداد</div>
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
              <div className="text-xs text-muted-foreground">فروخت کردہ اشیاء</div>
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
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="انوائس نمبر یا گاہک کا نام..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant={todayOnly ? "default" : "outline"}
            className={todayOnly ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            onClick={() => setTodayOnly(true)}
          >
            <Calendar className="w-4 h-4 ml-2" /> آج
          </Button>
          <Button
            variant={!todayOnly ? "default" : "outline"}
            className={!todayOnly ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            onClick={() => setTodayOnly(false)}
          >
            تمام
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
              کوئی فروخت نہیں ملی
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>انوائس نمبر</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>گاہک</TableHead>
                    <TableHead>کیشیئر</TableHead>
                    <TableHead className="text-left">اشیاء</TableHead>
                    <TableHead className="text-left">کل</TableHead>
                    <TableHead className="text-left">ادائیگی</TableHead>
                    <TableHead className="text-left">اقدامات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell dir="ltr" className="font-mono text-xs">
                        {s.invoiceNo}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(s.createdAt).toLocaleString("ur-PK", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell>{s.customerName || "عام گاہک"}</TableCell>
                      <TableCell className="text-xs">{s.user?.name || "-"}</TableCell>
                      <TableCell dir="ltr" className="text-left">
                        {s.items.length}
                      </TableCell>
                      <TableCell
                        dir="ltr"
                        className="text-left font-bold text-emerald-700"
                      >
                        {formatMoney(s.total, currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {s.paymentMethod === "CASH"
                            ? "نقد"
                            : s.paymentMethod === "CARD"
                            ? "کارڈ"
                            : "موبائل"}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
