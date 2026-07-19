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
  { v: "piece", l: "Piece" },
  { v: "kg", l: "Kg" },
  { v: "gram", l: "Gram" },
  { v: "litre", l: "Litre" },
  { v: "ml", l: "Millilitre" },
  { v: "dozen", l: "Dozen" },
  { v: "metre", l: "Metre" },
  { v: "feet", l: "Feet" },
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
      toast.error("Name is required");
      return;
    }
    if (Number(form.salePrice) <= 0) {
      toast.error("Sale price is required");
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
        toast.error(data.error || "Failed to save");
        setSaving(false);
        return;
      }
      toast.success(editId ? "Product updated" : "Product added");
      setDialogOpen(false);
      loadProducts();
    } catch {
      toast.error("Network error");
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
        toast.error(d.error || "Failed to delete");
        return;
      }
      toast.success("Product deleted");
      setDeleteId(null);
      loadProducts();
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            Products
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all items in your shop
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadProducts}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          {canManage && (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" /> New Product
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or barcode..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={activeCat} onValueChange={setActiveCat}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
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
              No products found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Sale</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="text-xs font-mono">
                        {p.barcode}
                        {p.barcodeType !== "COMPANY" && (
                          <Badge variant="outline" className="ml-1 text-[10px]">
                            Auto
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{p.category?.name || "-"}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatMoney(p.costPrice)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-700">
                        {formatMoney(p.salePrice)}
                      </TableCell>
                      <TableCell className="text-right">
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
                          <AlertTriangle className="w-3 h-3 inline mr-1 text-amber-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setPrintProduct(p)}
                            title="Print Barcode"
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
              {editId ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sugar, Ghee, Rice"
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <BarcodeIcon className="w-4 h-4 text-emerald-600" />
                  Has company barcode?
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
                  placeholder="Scan or type the barcode..."
                  className="text-left"
                />
              ) : (
                <p className="text-xs text-emerald-700">
                  ✓ A barcode will be auto-generated for this product (best for
                  loose items like sugar, ghee, etc.)
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
                <Label>Category</Label>
                <Select
                  value={form.categoryId || "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, categoryId: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
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
                <Label>Cost Price</Label>
                <Input
                  type="number"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label>Sale Price *</Label>
                <Input
                  type="number"
                  value={form.salePrice}
                  onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                  className="text-left"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label>Low Stock Alert</Label>
                <Input
                  type="number"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label>Tax %</Label>
                <Input
                  type="number"
                  value={form.taxRate}
                  onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                  className="text-left"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Product is active</Label>
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
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Delete
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
          <DialogTitle>Print Barcode Label</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-center font-medium">{product.name}</div>
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">Quantity</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
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
            Close
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
