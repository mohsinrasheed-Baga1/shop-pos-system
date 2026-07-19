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
import { toast } from "sonner";
import {
  Store,
  Save,
  Loader2,
  Info,
  Receipt,
  Percent,
  FileText,
  Phone,
  MapPin,
  Tag,
  ShieldCheck,
  KeyRound,
  UserCircle2,
} from "lucide-react";
import type { Settings } from "@/types";

interface FormState {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  currency: string;
  taxEnabled: boolean;
  defaultTax: number;
  receiptFooter: string;
  invoicePrefix: string;
}

const DEFAULT_FORM: FormState = {
  shopName: "",
  shopAddress: "",
  shopPhone: "",
  currency: "Rs",
  taxEnabled: false,
  defaultTax: 0,
  receiptFooter: "",
  invoicePrefix: "INV",
};

export function SettingsView() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(DEFAULT_FORM);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        if (!active) return;
        const s: Settings | undefined = data?.settings;
        if (s) {
          setForm({
            shopName: s.shopName ?? "",
            shopAddress: s.shopAddress ?? "",
            shopPhone: s.shopPhone ?? "",
            currency: s.currency || "Rs",
            taxEnabled: !!s.taxEnabled,
            defaultTax:
              typeof s.defaultTax === "number" && !isNaN(s.defaultTax)
                ? s.defaultTax
                : 0,
            receiptFooter: s.receiptFooter ?? "",
            invoicePrefix: s.invoicePrefix || "INV",
          });
        }
      } catch {
        toast.error("سیٹنگز لوڈ نہیں ہو سکیں");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const body = {
        shopName: form.shopName.trim() || "My Shop",
        shopAddress: form.shopAddress.trim(),
        shopPhone: form.shopPhone.trim(),
        currency: form.currency.trim() || "Rs",
        taxEnabled: form.taxEnabled,
        defaultTax: form.taxEnabled
          ? Number(form.defaultTax) || 0
          : 0,
        receiptFooter: form.receiptFooter.trim(),
        invoicePrefix: form.invoicePrefix.trim() || "INV",
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
      if (s) {
        setForm({
          shopName: s.shopName ?? "",
          shopAddress: s.shopAddress ?? "",
          shopPhone: s.shopPhone ?? "",
          currency: s.currency || "Rs",
          taxEnabled: !!s.taxEnabled,
          defaultTax:
            typeof s.defaultTax === "number" && !isNaN(s.defaultTax)
              ? s.defaultTax
              : 0,
          receiptFooter: s.receiptFooter ?? "",
          invoicePrefix: s.invoicePrefix || "INV",
        });
      }
      toast.success("سیٹنگز محفوظ ہو گئیں");
    } catch (err: any) {
      toast.error(err?.message || "سیٹنگز محفوظ نہیں ہو سکیں");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto" dir="rtl">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Skeleton className="h-11 w-36" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto" dir="rtl">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm shrink-0">
          <Store className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">دکان کی سیٹنگز</h1>
          <p className="text-sm text-muted-foreground">
            اپنے POS سسٹم کی مجموعی ترتیبات کو یہاں سے کنٹرول کریں
          </p>
        </div>
      </div>

      {/* Info card — scope of settings */}
      <Card className="border-emerald-100 bg-emerald-50/40 dark:bg-emerald-950/20">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="space-y-2 text-sm leading-6">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                یہ سیٹنگز پورے POS سسٹم پر لاگو ہوتی ہیں
              </p>
              <p className="text-muted-foreground">
                دکان کا نام، فون اور پتہ رسیدوں اور انوائس پر ظاہر ہوگا۔ ٹیکس
                کی ترتیبات فروخت کے حساب کتاب میں شامل ہوگی۔ کرنسی کی علامت
                تمام رقموں کے ساتھ دکھائی دیگی۔ انوائس پریفکس ہر نئی فروخت کے
                نمبر کے آغاز میں استعمال ہوگا۔
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <Receipt className="w-3.5 h-3.5" /> رسیدیں
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <FileText className="w-3.5 h-3.5" /> انوائس
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <Percent className="w-3.5 h-3.5" /> ٹیکس
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo credentials info card (read-only) */}
      <Card className="border-amber-200/70 bg-amber-50/40 dark:bg-amber-950/10">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-3">
              <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                ڈیمو اکاؤنٹس (صرف معلومات کے لیے)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-background/80 dark:bg-background/40 border border-amber-200/60 dark:border-amber-900/30 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      ایڈمن
                    </span>
                  </div>
                  <div className="text-xs font-mono space-y-0.5" dir="ltr">
                    <div className="text-muted-foreground">admin@pos.local</div>
                    <div className="text-muted-foreground">admin123</div>
                  </div>
                </div>
                <div className="rounded-lg bg-background/80 dark:bg-background/40 border border-amber-200/60 dark:border-amber-900/30 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <UserCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      کیشیئر
                    </span>
                  </div>
                  <div className="text-xs font-mono space-y-0.5" dir="ltr">
                    <div className="text-muted-foreground">
                      cashier@pos.local
                    </div>
                    <div className="text-muted-foreground">cashier123</div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                یہ اکاؤنٹس ترقیاتی مقاصد کے لیے دستیاب ہیں۔ پروڈکشن میں استعمال
                سے قبل تبدیل کریں۔
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings form */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            دکان کی تفصیل
          </CardTitle>
          <CardDescription>
            مندرجہ ذیل خانوں کو بھریں اور &quot;محفوظ کریں&quot; دبائیں
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* General shop info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="shopName" className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  دکان کا نام <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="shopName"
                  value={form.shopName}
                  onChange={(e) => setField("shopName", e.target.value)}
                  placeholder="مثلاً: نور جنرل سٹور"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label
                  htmlFor="shopAddress"
                  className="flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  پتہ
                </Label>
                <Textarea
                  id="shopAddress"
                  value={form.shopAddress}
                  onChange={(e) => setField("shopAddress", e.target.value)}
                  placeholder="دکان کا مکمل پتہ"
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shopPhone" className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  فون نمبر
                </Label>
                <Input
                  id="shopPhone"
                  value={form.shopPhone}
                  onChange={(e) => setField("shopPhone", e.target.value)}
                  placeholder="مثلاً: 0300-1234567"
                  dir="ltr"
                  className="text-right h-11"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="currency"
                  className="flex items-center gap-1.5"
                >
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  کرنسی
                </Label>
                <Input
                  id="currency"
                  value={form.currency}
                  onChange={(e) => setField("currency", e.target.value)}
                  placeholder="Rs"
                  dir="ltr"
                  className="text-right h-11"
                />
                <p className="text-xs text-muted-foreground">
                  یہ علامت تمام قیمتوں کے ساتھ دکھائی دیگی (مثلاً: Rs, $, ₹)
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
                    ٹیکس لاگو
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    فعال ہونے پر، فروخت پر ڈیفالٹ ٹیکس کا اطلاق ہوگا
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
                      ڈیفالٹ ٹیکس %
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
                      className="text-right h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      0 سے 100 کے درمیان فیصد (مثلاً: 5 کا مطلب 5%)
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
                  رسید کا آخر متن
                </Label>
                <Textarea
                  id="receiptFooter"
                  value={form.receiptFooter}
                  onChange={(e) => setField("receiptFooter", e.target.value)}
                  placeholder="مثلاً: شکریہ! دوبارہ تشریف لائیں۔"
                  rows={2}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  یہ متن ہر رسید کے آخر میں چھپے گا
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="invoicePrefix"
                  className="flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  انوائس پریفکس
                </Label>
                <Input
                  id="invoicePrefix"
                  value={form.invoicePrefix}
                  onChange={(e) => setField("invoicePrefix", e.target.value)}
                  placeholder="INV"
                  dir="ltr"
                  className="text-right h-11 uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  ہر انوائس نمبر کے آغاز میں یہ پریفکس استعمال ہوگا (مثلاً:
                  INV-0001)
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setForm(DEFAULT_FORM);
                  toast.info(" فارم ری سیٹ ہو گیا");
                }}
                disabled={saving}
                className="h-11"
              >
                ری سیٹ
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    محفوظ ہو رہا ہے…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    محفوظ کریں
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
