"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Store,
  Tag,
  Image as ImageIcon,
  Printer,
  Key,
  Shield,
  Database,
  Download,
  Upload,
  Trash2,
  ScanBarcode,
  Lock,
  Save,
  Loader2,
  Info,
  Receipt,
  Percent,
  FileText,
  Phone,
  MapPin,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  X,
} from "lucide-react";
import type { Settings } from "@/types";
import { useAppStore } from "@/stores/use-pos-store";

interface BackupFile {
  name: string;
  size: number;
  mtime: string;
}

// ============================================================
// Helpers
// ============================================================

/**
 * Resize/compress an image file to a base64 data URL using a canvas.
 * Used for the shop logo so we don't store huge base64 strings in the DB.
 */
function resizeImageToDataUrl(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(canvas.toDataURL("image/jpeg", 0.9));
        }
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US");
  } catch {
    return iso;
  }
}

// ============================================================
// Main SettingsView
// ============================================================
export function SettingsView() {
  const [loading, setLoading] = React.useState(true);
  const [settings, setSettings] = React.useState<Settings | null>(null);

  const reload = React.useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch {
      toast.error("Could not load settings");
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    (async () => {
      await reload();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [reload]);

  /**
   * Save a partial settings patch. The full settings object is sent to the
   * API (which upserts) so other fields are preserved.
   */
  const savePartial = React.useCallback(
    async (partial: Partial<Settings>): Promise<Settings> => {
      if (!settings) throw new Error("Settings not loaded");
      const pick = <K extends keyof Settings>(key: K): Settings[K] =>
        partial[key] !== undefined
          ? (partial[key] as Settings[K])
          : settings[key];
      const body = {
        shopName: pick("shopName"),
        subName: pick("subName"),
        logo: pick("logo"),
        shopAddress: pick("shopAddress"),
        shopPhone: pick("shopPhone"),
        currency: pick("currency"),
        taxEnabled: pick("taxEnabled"),
        defaultTax: pick("defaultTax"),
        receiptFooter: pick("receiptFooter"),
        invoicePrefix: pick("invoicePrefix"),
        printerWidth: pick("printerWidth"),
      };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Save failed");
      }
      const data = await res.json();
      const s: Settings | undefined = data?.settings;
      if (s) setSettings(s);
      return s as Settings;
    },
    [settings]
  );

  if (loading || !settings) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto" dir="ltr">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto" dir="ltr">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm shrink-0">
          <Store className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">Shop Settings</h1>
          <p className="text-sm text-muted-foreground">
            Control your overall POS system settings from here
          </p>
        </div>
      </div>

      {/* Info card — each section saves independently */}
      <Card className="border-emerald-100 bg-emerald-50/40 dark:bg-emerald-950/20">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="space-y-2 text-sm leading-6">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                Each section below saves independently
              </p>
              <p className="text-muted-foreground">
                Shop details, sub-name, logo, printer settings, passwords and
                backups are managed separately — use the Save button on each
                card.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <Receipt className="w-3.5 h-3.5" /> Receipts
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <FileText className="w-3.5 h-3.5" /> Invoices
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <Percent className="w-3.5 h-3.5" /> Tax
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <ImageIcon className="w-3.5 h-3.5" /> Logo
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1. Shop Details card */}
      <ShopDetailsCard settings={settings} onSave={savePartial} />

      {/* 2. Sub-Name card */}
      <SubNameCard settings={settings} onSave={savePartial} />

      {/* 3. Logo card */}
      <LogoCard settings={settings} onSave={savePartial} />

      {/* 4. Printer Settings card */}
      <PrinterSettingsCard settings={settings} onSave={savePartial} />

      {/* 5. Change Password card */}
      <ChangePasswordCard />

      {/* 6. Backup Password card */}
      <BackupPasswordCard settings={settings} onSaved={reload} />

      {/* 7. Backup & Restore card */}
      <BackupRestoreCard />

      {/* 8. Barcode Scanner card */}
      <ScannerCard />
    </div>
  );
}

// ============================================================
// 1. Shop Details card
// ============================================================
interface ShopDetailsCardProps {
  settings: Settings;
  onSave: (partial: Partial<Settings>) => Promise<Settings>;
}

function ShopDetailsCard({ settings, onSave }: ShopDetailsCardProps) {
  const [form, setForm] = React.useState({
    shopName: settings.shopName ?? "",
    shopAddress: settings.shopAddress ?? "",
    shopPhone: settings.shopPhone ?? "",
    currency: settings.currency || "Rs",
    taxEnabled: !!settings.taxEnabled,
    defaultTax:
      typeof settings.defaultTax === "number" && !isNaN(settings.defaultTax)
        ? settings.defaultTax
        : 0,
    receiptFooter: settings.receiptFooter ?? "",
    invoicePrefix: settings.invoicePrefix || "INV",
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setForm({
      shopName: settings.shopName ?? "",
      shopAddress: settings.shopAddress ?? "",
      shopPhone: settings.shopPhone ?? "",
      currency: settings.currency || "Rs",
      taxEnabled: !!settings.taxEnabled,
      defaultTax:
        typeof settings.defaultTax === "number" && !isNaN(settings.defaultTax)
          ? settings.defaultTax
          : 0,
      receiptFooter: settings.receiptFooter ?? "",
      invoicePrefix: settings.invoicePrefix || "INV",
    });
  }, [settings]);

  function setField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSave({
        shopName: form.shopName.trim() || "My Shop",
        shopAddress: form.shopAddress.trim(),
        shopPhone: form.shopPhone.trim(),
        currency: form.currency.trim() || "Rs",
        taxEnabled: form.taxEnabled,
        defaultTax: form.taxEnabled ? Number(form.defaultTax) || 0 : 0,
        receiptFooter: form.receiptFooter.trim(),
        invoicePrefix: form.invoicePrefix.trim() || "INV",
      });
      toast.success("Shop details saved");
    } catch (err: any) {
      toast.error(err?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Store className="w-5 h-5 text-emerald-600" />
          Shop Details
        </CardTitle>
        <CardDescription>
          Shop name, address, phone, currency, tax and receipt settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="shopName" className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                Shop Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="shopName"
                value={form.shopName}
                onChange={(e) => setField("shopName", e.target.value)}
                placeholder="e.g. Noor General Store"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="shopAddress" className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Address
              </Label>
              <Textarea
                id="shopAddress"
                value={form.shopAddress}
                onChange={(e) => setField("shopAddress", e.target.value)}
                placeholder="Full shop address"
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopPhone" className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Phone Number
              </Label>
              <Input
                id="shopPhone"
                value={form.shopPhone}
                onChange={(e) => setField("shopPhone", e.target.value)}
                placeholder="e.g. 0300-1234567"
                dir="ltr"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                Currency
              </Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) => setField("currency", e.target.value)}
                placeholder="Rs"
                dir="ltr"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                This symbol is shown with all amounts (e.g. Rs, $, &euro;)
              </p>
            </div>
          </div>

          <Separator />

          {/* Tax settings */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10 p-3">
              <div className="space-y-0.5">
                <Label
                  htmlFor="taxEnabled"
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <Percent className="w-3.5 h-3.5 text-emerald-600" />
                  Enable Tax
                </Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, default tax is applied to sales
                </p>
              </div>
              <Switch
                id="taxEnabled"
                checked={form.taxEnabled}
                onCheckedChange={(v) => setField("taxEnabled", v)}
              />
            </div>

            {form.taxEnabled && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="defaultTax"
                    className="flex items-center gap-1.5"
                  >
                    <Percent className="w-3.5 h-3.5 text-emerald-600" />
                    Default Tax %
                  </Label>
                  <Input
                    id="defaultTax"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={form.defaultTax}
                    onChange={(e) =>
                      setField("defaultTax", Number(e.target.value))
                    }
                    placeholder="0"
                    dir="ltr"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Percentage between 0 and 100 (e.g. 5 means 5%)
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Receipt & invoice settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-2 lg:col-span-2">
              <Label
                htmlFor="receiptFooter"
                className="flex items-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                Receipt Footer Text
              </Label>
              <Textarea
                id="receiptFooter"
                value={form.receiptFooter}
                onChange={(e) => setField("receiptFooter", e.target.value)}
                placeholder="e.g. Thank you! Please come again."
                rows={2}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This text is printed at the bottom of every receipt
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="invoicePrefix"
                className="flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                Invoice Prefix
              </Label>
              <Input
                id="invoicePrefix"
                value={form.invoicePrefix}
                onChange={(e) => setField("invoicePrefix", e.target.value)}
                placeholder="INV"
                dir="ltr"
                className="h-11 uppercase"
              />
              <p className="text-xs text-muted-foreground">
                This prefix is used at the start of every invoice number (e.g.
                INV-0001)
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[180px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Shop Details
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 2. Sub-Name card
// ============================================================
interface SubNameCardProps {
  settings: Settings;
  onSave: (partial: Partial<Settings>) => Promise<Settings>;
}

function SubNameCard({ settings, onSave }: SubNameCardProps) {
  const [subName, setSubName] = React.useState(settings.subName ?? "");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setSubName(settings.subName ?? "");
  }, [settings]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSave({ subName: subName.trim() });
      toast.success("Sub-name saved");
    } catch (err: any) {
      toast.error(err?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Tag className="w-5 h-5 text-emerald-600" />
          Sub-Name
        </CardTitle>
        <CardDescription>
          Tagline/brand name shown on shop cards and receipts (e.g. &quot;Master
          Abdul Rasheed &amp; Sons&quot;)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subName" className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              Sub-Name / Tagline
            </Label>
            <Input
              id="subName"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder="e.g. Master Abdul Rasheed & Sons"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to hide. Shown under the shop name on receipts and
              shop cards.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Sub-Name
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 3. Logo card
// ============================================================
interface LogoCardProps {
  settings: Settings;
  onSave: (partial: Partial<Settings>) => Promise<Settings>;
}

function LogoCard({ settings, onSave }: LogoCardProps) {
  const [logo, setLogo] = React.useState<string | null>(settings.logo ?? null);
  // Staged new logo from a selected file (not yet saved)
  const [pendingLogo, setPendingLogo] = React.useState<string | null>(null);
  // True when user clicked "Remove Logo" (will save null)
  const [pendingRemoved, setPendingRemoved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setLogo(settings.logo ?? null);
    setPendingLogo(null);
    setPendingRemoved(false);
  }, [settings]);

  const preview = pendingLogo ?? (pendingRemoved ? null : logo);
  const dirty = pendingLogo !== null || pendingRemoved;

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 200);
      setPendingLogo(dataUrl);
      setPendingRemoved(false);
      toast.success("Image ready — click Save Logo to apply");
    } catch (err: any) {
      toast.error(err?.message || "Could not process image");
    } finally {
      setProcessing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !dirty) return;
    setSaving(true);
    try {
      let nextLogo: string | null;
      if (pendingLogo) nextLogo = pendingLogo;
      else if (pendingRemoved) nextLogo = null;
      else nextLogo = logo;
      await onSave({ logo: nextLogo });
      setPendingLogo(null);
      setPendingRemoved(false);
      toast.success("Logo saved");
    } catch (err: any) {
      toast.error(err?.message || "Could not save logo");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-emerald-600" />
          Logo
        </CardTitle>
        <CardDescription>
          Upload your shop logo. It appears on receipts, shop cards, and
          barcodes. Image is automatically resized to 200×200 px.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-32 h-32 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10 flex items-center justify-center overflow-hidden shrink-0">
              {preview ? (
                <img
                  src={preview}
                  alt="Logo preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex-1 space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
                id="logo-upload"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => fileRef.current?.click()}
                  disabled={processing || saving}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Choose Image
                    </>
                  )}
                </Button>
                {pendingLogo && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10"
                    onClick={() => setPendingLogo(null)}
                    disabled={saving}
                  >
                    <X className="w-4 h-4" />
                    Discard
                  </Button>
                )}
                {logo && !pendingLogo && !pendingRemoved && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setPendingRemoved(true)}
                    disabled={saving}
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Logo
                  </Button>
                )}
                {pendingRemoved && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10"
                    onClick={() => setPendingRemoved(false)}
                    disabled={saving}
                  >
                    Undo Remove
                  </Button>
                )}
              </div>
              {pendingRemoved && (
                <p className="text-xs text-red-600">
                  Logo will be removed when you click Save Logo.
                </p>
              )}
              {pendingLogo && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  New logo staged. Click Save Logo to apply.
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving || !dirty}
              className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Logo
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 4. Printer Settings card
// ============================================================
interface PrinterSettingsCardProps {
  settings: Settings;
  onSave: (partial: Partial<Settings>) => Promise<Settings>;
}

function PrinterSettingsCard({ settings, onSave }: PrinterSettingsCardProps) {
  const [width, setWidth] = React.useState<number>(
    settings.printerWidth === 80 ? 80 : 58
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setWidth(settings.printerWidth === 80 ? 80 : 58);
  }, [settings]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSave({ printerWidth: width });
      toast.success("Printer settings saved");
    } catch (err: any) {
      toast.error(err?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Printer className="w-5 h-5 text-emerald-600" />
          Printer Settings
        </CardTitle>
        <CardDescription>
          Choose the thermal receipt paper width used by your printer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setWidth(58)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-colors ${
                width === 58
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                  : "border-border hover:border-emerald-300 hover:bg-emerald-50/30"
              }`}
            >
              <Printer className="w-7 h-7" />
              <span className="font-bold text-lg">58mm</span>
              <span className="text-xs text-muted-foreground">
                Small receipt
              </span>
            </button>
            <button
              type="button"
              onClick={() => setWidth(80)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-colors ${
                width === 80
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                  : "border-border hover:border-emerald-300 hover:bg-emerald-50/30"
              }`}
            >
              <Printer className="w-7 h-7" />
              <span className="font-bold text-lg">80mm</span>
              <span className="text-xs text-muted-foreground">
                Wide receipt
              </span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Current: {width}mm thermal paper. This affects receipt layout
            width.
          </p>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[200px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Printer Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 5. Change Password card
// ============================================================
function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const newPasswordError =
    newPassword.length > 0 && newPassword.length < 6
      ? "Password must be at least 6 characters"
      : "";
  const confirmError =
    confirmPassword.length > 0 && newPassword !== confirmPassword
      ? "Passwords do not match"
      : "";

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    confirmPassword === newPassword &&
    !saving;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Change failed");
      }
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Could not change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Key className="w-5 h-5 text-emerald-600" />
          Change Password
        </CardTitle>
        <CardDescription>Change your account login password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="curPwd" className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                Current Password
              </Label>
              <Input
                id="curPwd"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••"
                dir="ltr"
                className="h-11"
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPwd" className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-600" />
                New Password
              </Label>
              <Input
                id="newPwd"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 chars"
                dir="ltr"
                className="h-11"
                autoComplete="new-password"
              />
              {newPasswordError && (
                <p className="text-xs text-red-600">{newPasswordError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confPwd" className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-600" />
                Confirm Password
              </Label>
              <Input
                id="confPwd"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                dir="ltr"
                className="h-11"
                autoComplete="new-password"
              />
              {confirmError && (
                <p className="text-xs text-red-600">{confirmError}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[180px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 6. Backup Password card
// ============================================================
interface BackupPasswordCardProps {
  settings: Settings;
  onSaved: () => Promise<void>;
}

function BackupPasswordCard({ settings, onSaved }: BackupPasswordCardProps) {
  const isSet = !!settings.backupPasswordHash;
  const [mode, setMode] = React.useState<"idle" | "set" | "update" | "generated">(
    "idle"
  );
  const [newPassword, setNewPassword] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [generated, setGenerated] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);

  const newPasswordError =
    newPassword.length > 0 && newPassword.length < 4
      ? "Password must be at least 4 characters"
      : "";

  async function onSet(e: React.FormEvent) {
    e.preventDefault();
    if (saving || newPassword.length < 4) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/backup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set", password: newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed");
      }
      toast.success("Backup password set");
      setNewPassword("");
      setMode("idle");
      await onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Could not set password");
    } finally {
      setSaving(false);
    }
  }

  async function onUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (saving || newPassword.length < 4) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/backup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          currentPassword,
          password: newPassword,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed");
      }
      toast.success("Backup password updated");
      setNewPassword("");
      setCurrentPassword("");
      setMode("idle");
      await onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Could not update password");
    } finally {
      setSaving(false);
    }
  }

  async function onGenerate() {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/settings/backup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed");
      }
      const data = await res.json();
      setGenerated(data.generated);
      setMode("generated");
      toast.success("Password generated");
      await onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Could not generate password");
    } finally {
      setGenerating(false);
    }
  }

  function copyGenerated() {
    if (!generated) return;
    navigator.clipboard
      .writeText(generated)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Copy failed"));
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Backup Password
            </CardTitle>
            <CardDescription>
              This password protects backup/restore and data removal operations.
            </CardDescription>
          </div>
          {isSet ? (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              <ShieldCheck className="w-3 h-3" />
              Set
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-700 border-amber-300">
              Not Set
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Generated password alert */}
        {mode === "generated" && generated && (
          <Alert className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
            <KeyRound className="w-4 h-4 text-emerald-700" />
            <AlertTitle className="text-emerald-800 dark:text-emerald-300">
              Generated Backup Password
            </AlertTitle>
            <AlertDescription>
              <div className="flex items-center gap-2 mt-1">
                <code className="font-mono font-bold text-base tracking-wider bg-background px-2 py-1 rounded border">
                  {generated}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={copyGenerated}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs mt-2">
                Save this password somewhere safe. You will need it for backup,
                restore, and remove-data operations.
              </p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 mt-2"
                onClick={() => setMode("idle")}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* If not set: show set + generate options */}
        {!isSet && mode !== "generated" && (
          <>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={mode === "set" ? "default" : "outline"}
                className={
                  mode === "set"
                    ? "h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                }
                onClick={() => setMode(mode === "set" ? "idle" : "set")}
              >
                <Key className="w-4 h-4" />
                Set Backup Password
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={onGenerate}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Generate Password
              </Button>
            </div>
            {mode === "set" && (
              <form onSubmit={onSet} className="space-y-3 pt-2 border-t">
                <div className="space-y-2">
                  <Label htmlFor="bpNew" className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    New Backup Password
                  </Label>
                  <Input
                    id="bpNew"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    dir="ltr"
                    className="h-11"
                    autoComplete="new-password"
                  />
                  {newPasswordError && (
                    <p className="text-xs text-red-600">{newPasswordError}</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving || newPassword.length < 4}
                    className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Set Password
                  </Button>
                </div>
              </form>
            )}
          </>
        )}

        {/* If set: show update option */}
        {isSet && mode === "idle" && (
          <>
            <p className="text-sm text-muted-foreground">
              A backup password is currently set. You can change it below —
              you&apos;ll need to provide the current one.
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => setMode("update")}
            >
              <Key className="w-4 h-4" />
              Change Backup Password
            </Button>
          </>
        )}

        {isSet && mode === "update" && (
          <form onSubmit={onUpdate} className="space-y-3 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor="bpCur" className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                Current Backup Password
              </Label>
              <Input
                id="bpCur"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current backup password"
                dir="ltr"
                className="h-11"
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bpNewUpd" className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-600" />
                New Backup Password
              </Label>
              <Input
                id="bpNewUpd"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 4 characters"
                dir="ltr"
                className="h-11"
                autoComplete="new-password"
              />
              {newPasswordError && (
                <p className="text-xs text-red-600">{newPasswordError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="h-10"
                onClick={() => {
                  setMode("idle");
                  setNewPassword("");
                  setCurrentPassword("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || newPassword.length < 4}
                className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Update Password
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// 7. Backup & Restore card
// ============================================================
function BackupRestoreCard() {
  const [backups, setBackups] = React.useState<BackupFile[]>([]);
  const [loadingList, setLoadingList] = React.useState(true);
  const [creating, setCreating] = React.useState(false);

  // Remove Data dialog state
  const [removeOpen, setRemoveOpen] = React.useState(false);
  const [removePwd, setRemovePwd] = React.useState("");
  const [removing, setRemoving] = React.useState(false);

  // Restore Data dialog state
  const [restoreOpen, setRestoreOpen] = React.useState(false);
  const [restoreBackup, setRestoreBackup] = React.useState<string>("");
  const [restorePwd, setRestorePwd] = React.useState("");
  const [restoring, setRestoring] = React.useState(false);

  // Per-row Restore dialog state (data recovery)
  const [rowRestore, setRowRestore] = React.useState<BackupFile | null>(null);
  const [rowRestorePwd, setRowRestorePwd] = React.useState("");
  const [rowRestoring, setRowRestoring] = React.useState(false);

  const loadBackups = React.useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/backup", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setBackups(data.backups || []);
    } catch {
      toast.error("Could not load backups");
    } finally {
      setLoadingList(false);
    }
  }, []);

  React.useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  async function onCreate() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed");
      }
      const data = await res.json();
      toast.success(`Backup created: ${data.backup?.name || "OK"}`);
      await loadBackups();
    } catch (err: any) {
      toast.error(err?.message || "Could not create backup");
    } finally {
      setCreating(false);
    }
  }

  async function onRemoveData(e: React.MouseEvent) {
    // Prevent AlertDialog from auto-closing; we close manually on success.
    e.preventDefault();
    if (removing) return;
    if (!removePwd) {
      toast.error("Enter your backup password");
      return;
    }
    setRemoving(true);
    try {
      const res = await fetch("/api/backup/remove-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: removePwd }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed");
      }
      toast.success(
        "Transactional data removed. Products and cards preserved."
      );
      setRemoveOpen(false);
      setRemovePwd("");
    } catch (err: any) {
      toast.error(err?.message || "Could not remove data");
    } finally {
      setRemoving(false);
    }
  }

  async function callRestore(backupName: string, pwd: string) {
    const res = await fetch("/api/backup/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd, backupName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || "Restore failed");
    }
    return res.json();
  }

  async function onRestoreData() {
    if (restoring) return;
    if (!restoreBackup) {
      toast.error("Select a backup");
      return;
    }
    if (!restorePwd) {
      toast.error("Enter your backup password");
      return;
    }
    setRestoring(true);
    try {
      await callRestore(restoreBackup, restorePwd);
      toast.success("Database restored. Please restart the app.");
      setRestoreOpen(false);
      setRestoreBackup("");
      setRestorePwd("");
    } catch (err: any) {
      toast.error(err?.message || "Could not restore");
    } finally {
      setRestoring(false);
    }
  }

  async function onRowRestore() {
    if (rowRestoring || !rowRestore) return;
    if (!rowRestorePwd) {
      toast.error("Enter your backup password");
      return;
    }
    setRowRestoring(true);
    try {
      await callRestore(rowRestore.name, rowRestorePwd);
      toast.success("Database restored. Please restart the app.");
      setRowRestore(null);
      setRowRestorePwd("");
    } catch (err: any) {
      toast.error(err?.message || "Could not restore");
    } finally {
      setRowRestoring(false);
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-600" />
          Backup &amp; Restore
        </CardTitle>
        <CardDescription>
          Create database backups, restore from a previous backup, or remove
          transactional data. All operations require the backup password.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={onCreate}
            disabled={creating}
            className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Create Backup Now
          </Button>

          {/* Restore Data dialog */}
          <Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                disabled={backups.length === 0}
              >
                <Upload className="w-4 h-4" />
                Restore Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Restore Database</DialogTitle>
                <DialogDescription>
                  Select a backup to restore. The current database will be
                  replaced. A safety backup of the current DB is created
                  automatically before restore.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="restoreSelect"
                    className="flex items-center gap-1.5"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    Backup File
                  </Label>
                  <select
                    id="restoreSelect"
                    value={restoreBackup}
                    onChange={(e) => setRestoreBackup(e.target.value)}
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">— Select a backup —</option>
                    {backups.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name} ({formatBytes(b.size)}, {formatDate(b.mtime)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="restorePwd"
                    className="flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    Backup Password
                  </Label>
                  <Input
                    id="restorePwd"
                    type="password"
                    value={restorePwd}
                    onChange={(e) => setRestorePwd(e.target.value)}
                    placeholder="Enter backup password"
                    dir="ltr"
                    className="h-11"
                    autoComplete="off"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRestoreOpen(false)}
                  disabled={restoring}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={onRestoreData}
                  disabled={restoring || !restoreBackup || !restorePwd}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {restoring ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Restore
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Remove Data alert dialog */}
          <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-10 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Remove Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-700">
                  Remove all transactional data?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will DELETE all sales, transactions, and reports.
                  Products and customer cards will be KEPT. This action cannot
                  be undone. Enter your backup password to confirm.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label htmlFor="rmPwd" className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-red-600" />
                  Backup Password
                </Label>
                <Input
                  id="rmPwd"
                  type="password"
                  value={removePwd}
                  onChange={(e) => setRemovePwd(e.target.value)}
                  placeholder="Enter backup password"
                  dir="ltr"
                  className="h-11"
                  autoComplete="off"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={removing}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onRemoveData}
                  disabled={removing || !removePwd}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {removing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Remove Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Separator />

        {/* Backups list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              Existing Backups
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={loadBackups}
              disabled={loadingList}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingList ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
          {loadingList ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground rounded-lg border border-dashed">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No backups yet. Click &quot;Create Backup Now&quot; to make one.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-lg border divide-y">
              {backups.map((b) => (
                <div
                  key={b.name}
                  className="flex items-center gap-3 p-3 hover:bg-muted/40"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <Database className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate font-mono">
                      {b.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatBytes(b.size)} • {formatDate(b.mtime)}
                    </div>
                  </div>
                  {/* Per-row Restore — data recovery */}
                  <Dialog
                    open={rowRestore?.name === b.name}
                    onOpenChange={(open) => {
                      if (!open) {
                        setRowRestore(null);
                        setRowRestorePwd("");
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => {
                          setRowRestore(b);
                          setRowRestorePwd("");
                        }}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Restore
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Restore from {b.name}?</DialogTitle>
                        <DialogDescription>
                          The current database will be replaced with this
                          backup. A safety backup of the current DB is created
                          automatically before restore. Enter your backup
                          password to confirm.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Label
                          htmlFor="rowRestorePwd"
                          className="flex items-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5 text-emerald-600" />
                          Backup Password
                        </Label>
                        <Input
                          id="rowRestorePwd"
                          type="password"
                          value={rowRestorePwd}
                          onChange={(e) => setRowRestorePwd(e.target.value)}
                          placeholder="Enter backup password"
                          dir="ltr"
                          className="h-11"
                          autoComplete="off"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setRowRestore(null);
                            setRowRestorePwd("");
                          }}
                          disabled={rowRestoring}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={onRowRestore}
                          disabled={rowRestoring || !rowRestorePwd}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {rowRestoring ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          Restore
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 8. Barcode Scanner card
// ============================================================
function ScannerCard() {
  const setView = useAppStore((s) => s.setView);
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ScanBarcode className="w-5 h-5 text-emerald-600" />
          Barcode Scanner
        </CardTitle>
        <CardDescription>
          Open the camera barcode scanner. Scanned products are added to the
          cart automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground flex-1 min-w-[200px]">
            Use this to scan product barcodes with your device camera, or enter
            them manually.
          </p>
          <Button
            type="button"
            onClick={() => setView("scanner")}
            className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <ScanBarcode className="w-4 h-4" />
            Open Scanner
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
