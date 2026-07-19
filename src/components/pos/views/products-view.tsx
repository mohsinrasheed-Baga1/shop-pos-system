"use client";

import * as React from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Printer,
  Barcode as BarcodeIcon,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatMoney, unitLabel } from "@/lib/pos-utils";
import { BarcodeDisplay } from "@/components/barcode/barcode-display";
import type { Product, Category } from "@/types";

interface ProductsViewProps {
  userRole: string;
}

const UNITS = [
  { v: "piece", l: "پیس" },
  { v: "kg", l: "کلو" },
  { v: "gram", l: "گرام" },
  { v: "litre", l: "لیٹر" },
  { v: "ml", l: "ملی لیٹر" },
  { v: "dozen", l: "درجن" },
  { v: "metre", l: "میٹر" },
  { v: "feet", l: "فٹ" },
];

const emptyForm = {
  name: "",
  barcode: "",
  categoryId: "",
  costPrice: "",
  salePrice: "",
  unit: "piece",
  stock: "",
  minStock: "",
  taxRate: "",
  hasBarcode: true,
  active: true,
};

export function ProductsView({ userRole }: ProductsViewProps) {
  const canManage = userRole !== "CASHIER";
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [q, setQ] = React.useState("");
  const [activeCat, setActiveCat] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<any>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [printProduct, setPrintProduct] = React.useState<Product | null>(null);

  const loadProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (activeCat !== "all") params.set("categoryId", activeCat);
      const res = await fetch(`/api/products?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      toast.error("پروڈکٹس لوڈ نہیں ہوئے");
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

  function openAdd() {
    setForm(emptyForm);
    setEditId(null);
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      barcode: p.barcodeType === "COMPANY" ? p.barcode : "",
      categoryId: p.categoryId || "",
      costPrice: p.costPrice.toString(),
      salePrice: p.salePrice.toString(),
      unit: p.unit,
      stock: p.stock.toString(),
      minStock: p.minStock.toString(),
      taxRate: p.taxRate.toString(),
      hasBarcode: p.hasBarcode,
      active: p.active,
    });
    setEditId(p.id);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("نام درکار ہے");
      return;
    }
    if (Number(form.salePrice) <= 0) {
      toast.error("فروخت قیمت درکار ہے");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        barcode: form.barcode.trim(),
        categoryId: form.categoryId || null,
        costPrice: Number(form.costPrice) || 0,
        salePrice: Number(form.salePrice) || 0,
        unit: form.unit,
        stock: Number(form.stock) || 0,
        minStock: Number(form.minStock) || 0,
        taxRate: Number(form.taxRate) || 0,
        hasBarcode: form.hasBarcode,
        active: form.active,
      };
      const url = editId
        ? `/api/products/${editId}`
        : "/api/products";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "محفوظ نہیں ہوا");
        setSaving(false);
        return;
      }
      toast.success(editId ? "اپڈیٹ ہو گیا" : "پروڈکٹ شامل ہو گیا");
      setDialogOpen(false);
      loadProducts();
    } catch {
      toast.error("نیٹ ورک مسئلہ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/products/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "حذف نہیں ہوا");
        return;
      }
      toast.success("پروڈکٹ حذف ہو گیا");
      setDeleteId(null);
      loadProducts();
    } catch {
      toast.error("نیٹ ورک مسئلہ");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            پروڈکٹس
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            اپنی دکان کی ساری اشیاء مینج کریں
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadProducts}>
            <RefreshCw className="w-4 h-4 ml-2" /> تازہ
          </Button>
          {canManage && (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openAdd}>
              <Plus className="w-4 h-4 ml-2" /> نیا پروڈکٹ
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="نام یا بارکوڈ سے تلاش کریں..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={activeCat} onValueChange={setActiveCat}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="کیٹگری" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">تمام</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              کوئی پروڈکٹ نہیں ملا
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام</TableHead>
                    <TableHead>بارکوڈ</TableHead>
                    <TableHead>کیٹگری</TableHead>
                    <TableHead className="text-left">خرید</TableHead>
                    <TableHead className="text-left">فروخت</TableHead>
                    <TableHead className="text-left">سٹاک</TableHead>
                    <TableHead className="text-left">اقدامات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Package className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <div>{p.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {unitLabel(p.unit)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell dir="ltr" className="text-xs font-mono">
                        {p.barcode}
                        {p.barcodeType !== "COMPANY" && (
                          <Badge variant="outline" className="mr-1 text-[10px]">
                            آٹو
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{p.category?.name || "-"}</TableCell>
                      <TableCell dir="ltr" className="text-left text-muted-foreground">
                        {formatMoney(p.costPrice)}
                      </TableCell>
                      <TableCell dir="ltr" className="text-left font-bold text-emerald-700">
                        {formatMoney(p.salePrice)}
                      </TableCell>
                      <TableCell dir="ltr" className="text-left">
                        <span
                          className={`font-medium ${
                            p.stock <= 0
                              ? "text-red-600"
                              : p.stock <= p.minStock
                              ? "text-amber-600"
                              : ""
                          }`}
                        >
                          {p.stock}
                        </span>
                        {p.stock <= p.minStock && (
                          <AlertTriangle className="w-3 h-3 inline ml-1 text-amber-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setPrintProduct(p)}
                            title="بارکوڈ پرنٹ"
                          >
                            <BarcodeIcon className="w-4 h-4 text-emerald-600" />
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => openEdit(p)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteId(p.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? "پروڈکٹ تبدیل کریں" : "نیا پروڈکٹ شامل کریں"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>پروڈکٹ کا نام *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: چینی، گھی، چاول"
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <BarcodeIcon className="w-4 h-4 text-emerald-600" />
                  کمپنی کا بارکوڈ موجود ہے؟
                </Label>
                <Switch
                  checked={form.hasBarcode}
                  onCheckedChange={(c) => setForm({ ...form, hasBarcode: c })}
                />
              </div>
              {form.hasBarcode ? (
                <Input
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder="بارکوڈ سکین یا ٹائپ کریں..."
                  dir="ltr"
                  className="text-left"
                />
              ) : (
                <p className="text-xs text-emerald-700">
                  ✓ اس پروڈکٹ کا بارکوڈ خودکار بنایا جائے گا (چینی، گھی وغیرہ
                  کے لیے بہترین)
                </p>
              )}
              {form.barcode && (
                <div className="bg-white rounded p-2 flex justify-center">
                  <BarcodeDisplay
                    value={form.barcode}
                    format="EAN13"
                    height={50}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>کیٹگری</Label>
                <Select
                  value={form.categoryId || "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, categoryId: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بغیر کیٹگری</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>اکائی</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) => setForm({ ...form, unit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u.v} value={u.v}>
                        {u.l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>خرید قیمت</Label>
                <Input
                  type="number"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label>فروخت قیمت *</Label>
                <Input
                  type="number"
                  value={form.salePrice}
                  onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                  dir="ltr"
                  className="text-left"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>سٹاک</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label>کم سٹاک الرٹ</Label>
                <Input
                  type="number"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label>ٹیکس %</Label>
                <Input
                  type="number"
                  value={form.taxRate}
                  onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                  dir="ltr"
                  className="text-left"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>پروڈکٹ فعال ہے</Label>
              <Switch
                checked={form.active}
                onCheckedChange={(c) => setForm({ ...form, active: c })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              منسوخ
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "محفوظ ہو رہا..." : "محفوظ کریں"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>پروڈکٹ حذف کریں؟</AlertDialogTitle>
            <AlertDialogDescription>
              یہ عمل واپس نہیں ہوگا۔
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>منسوخ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              حذف کریں
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* print barcode dialog */}
      <BarcodePrintDialog
        product={printProduct}
        onClose={() => setPrintProduct(null)}
      />
    </div>
  );
}

function BarcodePrintDialog({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const [count, setCount] = React.useState(1);
  const labelRef = React.useRef<HTMLDivElement>(null);

  if (!product) return null;

  function handlePrint() {
    const content = labelRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`
      <html><head><title>Barcode ${product!.name}</title>
      <style>
        @page { margin: 4mm; }
        body { margin: 0; padding: 4px; font-family: Tahoma, sans-serif; }
        .label { display: inline-block; width: 48%; border: 1px dashed #999; padding: 6px; text-align: center; box-sizing: border-box; margin: 2px; page-break-inside: avoid; }
        .name { font-size: 12px; font-weight: bold; margin-bottom: 2px; }
        .price { font-size: 14px; font-weight: bold; }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  }

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>بارکوڈ لیبل پرنٹ</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-center font-medium">{product.name}</div>
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">تعداد</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
              dir="ltr"
              className="text-left w-24"
            />
          </div>
          <div
            ref={labelRef}
            className="bg-white border rounded p-2 grid grid-cols-2 gap-1"
          >
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="label border border-dashed border-gray-300 p-1 text-center">
                <div className="text-xs font-bold truncate">{product.name}</div>
                <BarcodeDisplay
                  value={product.barcode}
                  format={product.barcodeType === "EAN13" ? "EAN13" : "CODE128"}
                  height={40}
                  width={1.4}
                />
                <div className="text-sm font-bold text-emerald-700">
                  {formatMoney(product.salePrice)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            بند کریں
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handlePrint}>
            <Printer className="w-4 h-4 ml-2" /> پرنٹ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
