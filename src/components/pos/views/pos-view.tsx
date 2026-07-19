"use client";

import * as React from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  X,
  Printer,
  CheckCircle2,
  Package,
  ScanBarcode,
  Banknote,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useCartStore, useAppStore } from "@/stores/use-pos-store";
import { formatMoney, unitLabel, isLooseUnit } from "@/lib/pos-utils";
import type { Product, Category } from "@/types";
import { Receipt } from "@/components/pos/receipt";

interface PosViewProps {
  settings: any;
}

export function PosView({ settings }: PosViewProps) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [q, setQ] = React.useState("");
  const [activeCat, setActiveCat] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [paidAmount, setPaidAmount] = React.useState("");
  const [lastSale, setLastSale] = React.useState<any>(null);
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const cart = useCartStore();
  const { setView } = useAppStore();
  const currency = settings?.currency || "Rs";
  const taxEnabled = !!settings?.taxEnabled;
  const totals = cart.totals(taxEnabled);

  const loadProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (activeCat) params.set("categoryId", activeCat);
      const res = await fetch(`/api/products?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [q, activeCat]);

  const loadCategories = React.useCallback(async () => {
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {}
  }, []);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  React.useEffect(() => {
    const t = setTimeout(loadProducts, 200);
    return () => clearTimeout(t);
  }, [loadProducts]);

  function addToCart(product: Product) {
    if (!product.active) {
      toast.error("This product is inactive");
      return;
    }
    if (product.stock <= 0 && !isLooseUnit(product.unit)) {
      toast.warning("Out of stock");
    }
    cart.addItem(product, 1);
  }

  async function handleCheckout() {
    if (cart.items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        items: cart.items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: i.product.salePrice,
        })),
        discount: cart.discount,
        paidAmount: Number(paidAmount) || totals.total,
        paymentMethod: cart.paymentMethod,
        customerName: cart.customerName,
        customerPhone: cart.customerPhone,
        invoicePrefix: settings?.invoicePrefix || "INV",
      };
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Sale failed");
        setSubmitting(false);
        return;
      }
      setLastSale(data.sale);
      setReceiptOpen(true);
      setCheckoutOpen(false);
      cart.clear();
      setPaidAmount("");
      toast.success("Sale completed!");
      loadProducts();
    } catch (e) {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const change = Math.max(
    0,
    (Number(paidAmount) || 0) - totals.total
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-emerald-600" />
            Sell (POS)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select products or scan a barcode
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setView("scanner")}
          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        >
          <ScanBarcode className="w-4 h-4 mr-2" /> Barcode Scanner
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Products section */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or barcode..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          {/* category chips */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCat("")}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                activeCat === ""
                  ? "bg-emerald-600 text-white"
                  : "bg-muted hover:bg-muted/70"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  activeCat === c.id
                    ? "bg-emerald-600 text-white"
                    : "bg-muted hover:bg-muted/70"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                No products found
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={!p.active}
                  className="group text-left bg-card rounded-xl border p-3 hover:border-emerald-400 hover:shadow-md transition-all disabled:opacity-50"
                >
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-emerald-50 to-amber-50 flex items-center justify-center mb-2 overflow-hidden">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-emerald-600/50" />
                    )}
                  </div>
                  <div className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                    {p.name}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-emerald-700 font-bold text-sm">
                      {formatMoney(p.salePrice, currency)}
                    </span>
                    <span
                      className={`text-xs ${
                        p.stock <= 0
                          ? "text-red-500"
                          : p.stock <= p.minStock
                          ? "text-amber-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {p.stock} {unitLabel(p.unit)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart section */}
        <div className="lg:sticky lg:top-4 h-fit">
          <Card className="border-emerald-100">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  Cart
                  {totals.itemCount > 0 && (
                    <Badge className="bg-emerald-600">{totals.itemCount}</Badge>
                  )}
                </h2>
                {cart.items.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => cart.clear()}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Clear
                  </Button>
                )}
              </div>

              {cart.items.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Cart is empty
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[40vh] pr-2">
                    <div className="space-y-2">
                      {cart.items.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center gap-2 rounded-lg border p-2 bg-background"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {item.product.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatMoney(item.product.salePrice, currency)} /{" "}
                              {unitLabel(item.product.unit)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() =>
                                cart.setQty(
                                  item.product.id,
                                  item.quantity - (isLooseUnit(item.product.unit) ? 0.5 : 1)
                                )
                              }
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              className="h-7 w-14 text-center px-1"
                              value={item.quantity}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                if (!isNaN(v))
                                  cart.setQty(item.product.id, v);
                              }}
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() =>
                                cart.setQty(
                                  item.product.id,
                                  item.quantity + (isLooseUnit(item.product.unit) ? 0.5 : 1)
                                )
                              }
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-sm font-bold text-emerald-700 w-16 text-right">
                            {formatMoney(
                              item.product.salePrice * item.quantity,
                              currency
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-600 hover:bg-red-50"
                            onClick={() => cart.removeItem(item.product.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <Separator />

                  {/* customer */}
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Customer name"
                      value={cart.customerName}
                      onChange={(e) =>
                        cart.setCustomer(e.target.value, cart.customerPhone)
                      }
                      className="h-9 text-sm"
                    />
                    <Input
                      placeholder="Phone"
                      value={cart.customerPhone}
                      onChange={(e) =>
                        cart.setCustomer(cart.customerName, e.target.value)
                      }
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* discount */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Discount</Label>
                    <Input
                      type="number"
                      value={cart.discount || ""}
                      onChange={(e) =>
                        cart.setDiscount(Number(e.target.value) || 0)
                      }
                      className="h-9"
                    />
                  </div>

                  {/* totals */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatMoney(totals.subtotal, currency)}</span>
                    </div>
                    {taxEnabled && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span>{formatMoney(totals.taxTotal, currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span>-{formatMoney(totals.discount, currency)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-emerald-700">
                        {formatMoney(totals.total, currency)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
                    onClick={() => setCheckoutOpen(true)}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Checkout
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Checkout dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-lg p-4 text-center">
              <div className="text-sm text-muted-foreground">Total Bill</div>
              <div className="text-3xl font-bold text-emerald-700">
                {formatMoney(totals.total, currency)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { v: "CASH", label: "Cash", icon: Banknote },
                { v: "CARD", label: "Card", icon: CreditCard },
                { v: "MOBILE", label: "Mobile", icon: Smartphone },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.v}
                    onClick={() => cart.setPaymentMethod(m.v as any)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-lg border-2 transition-colors ${
                      cart.paymentMethod === m.v
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label>Amount Received</Label>
              <Input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder={totals.total.toString()}
                className="h-12 text-lg text-left"
                autoFocus
              />
            </div>

            {Number(paidAmount) > 0 && (
              <div className="flex justify-between items-center bg-amber-50 rounded-lg p-3">
                <span className="text-sm font-medium">Change</span>
                <span className="text-xl font-bold text-amber-700">
                  {formatMoney(change, currency)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {[500, 1000, 2000, 5000].map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  size="sm"
                  onClick={() => setPaidAmount(amt.toString())}
                >
                  {amt}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCheckoutOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleCheckout}
              disabled={submitting}
            >
              {submitting ? "Processing..." : "Complete Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt dialog */}
      <Receipt
        sale={lastSale}
        settings={settings}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
      />
    </div>
  );
}
