"use client";

import * as React from "react";
import {
  ScanBarcode,
  Search,
  Plus,
  Package,
  CheckCircle2,
  XCircle,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/barcode/barcode-scanner";
import { useCartStore, useAppStore } from "@/stores/use-pos-store";
import { formatMoney, unitLabel } from "@/lib/pos-utils";
import type { Product } from "@/types";

export function ScannerView() {
  const [manualCode, setManualCode] = React.useState("");
  const [lastFound, setLastFound] = React.useState<Product | null>(null);
  const [lastStatus, setLastStatus] = React.useState<"found" | "notfound" | null>(null);
  const [history, setHistory] = React.useState<
    { code: string; name: string; found: boolean; time: string }[]
  >([]);
  const [settings, setSettings] = React.useState<any>(null);

  const cart = useCartStore();
  const { setView } = useAppStore();

  React.useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .catch(() => {});
  }, []);

  async function lookup(code: string) {
    if (!code) return;
    try {
      const res = await fetch(`/api/barcode?code=${encodeURIComponent(code)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.found && data.product) {
        const p: Product = data.product;
        setLastFound(p);
        setLastStatus("found");
        cart.addItem(p, 1);
        toast.success(`${p.name} added to cart`);
        setHistory((h) =>
          [
            { code, name: p.name, found: true, time: new Date().toLocaleTimeString("en-US") },
            ...h,
          ].slice(0, 20)
        );
      } else {
        setLastFound(null);
        setLastStatus("notfound");
        toast.warning("This barcode is not in the system");
        setHistory((h) =>
          [
            { code, name: "Not found", found: false, time: new Date().toLocaleTimeString("en-US") },
            ...h,
          ].slice(0, 20)
        );
      }
    } catch {
      toast.error("Lookup failed");
    }
  }

  function onManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    lookup(manualCode.trim());
    setManualCode("");
  }

  const currency = settings?.currency || "Rs";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScanBarcode className="w-6 h-6 text-emerald-600" />
            Barcode Scanner
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scan barcodes with your camera — products are added to cart automatically
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setView("pos")}
        >
          <ShoppingCart className="w-4 h-4 mr-2" /> Go to POS ({cart.items.length})
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scanner */}
        <Card className="border-emerald-100">
          <CardContent className="p-4 space-y-4">
            <h2 className="font-bold">Camera Scanner</h2>
            <BarcodeScanner onScan={(code) => lookup(code)} debounceMs={2000} />

            <div className="pt-2 border-t">
              <form onSubmit={onManualSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter barcode manually..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="pl-10 text-left"
                  />
                </div>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  <Search className="w-4 h-4 mr-1" /> Find
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Result + cart */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h2 className="font-bold">Last Result</h2>
              {lastStatus === null && (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  No scan yet
                </div>
              )}
              {lastStatus === "notfound" && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <XCircle className="w-8 h-8 text-red-500 shrink-0" />
                  <div>
                    <div className="font-medium text-red-700">Product not found</div>
                    <div className="text-xs text-red-600">
                      This barcode is not in the system. Add a new product.
                    </div>
                  </div>
                </div>
              )}
              {lastStatus === "found" && lastFound && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">{lastFound.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatMoney(lastFound.salePrice, currency)} • Stock:{" "}
                      {lastFound.stock} {unitLabel(lastFound.unit)}
                    </div>
                  </div>
                  <Badge className="bg-emerald-600">In Cart</Badge>
                </div>
              )}
              {lastStatus === "notfound" && (
                <Button
                  variant="outline"
                  className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => setView("products")}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add New Product
                </Button>
              )}
            </CardContent>
          </Card>

          {cart.items.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    Cart
                    <Badge className="bg-emerald-600">{cart.items.length}</Badge>
                  </h2>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setView("pos")}
                  >
                    Checkout
                  </Button>
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {cart.items.map((it) => (
                    <div
                      key={it.product.id}
                      className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                    >
                      <span className="flex-1 truncate">{it.product.name}</span>
                      <span className="text-muted-foreground px-2">
                        x{it.quantity}
                      </span>
                      <span className="font-medium text-emerald-700">
                        {formatMoney(
                          it.product.salePrice * it.quantity,
                          currency
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-emerald-700">
                    {formatMoney(cart.totals(!!settings?.taxEnabled).total, currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Scan history */}
      {history.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Scan History
            </h2>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {h.code}
                  </span>
                  <span className="flex-1 px-3 truncate">{h.name}</span>
                  {h.found ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      Found
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Not Found</Badge>
                  )}
                  <span className="text-xs text-muted-foreground px-2">{h.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
