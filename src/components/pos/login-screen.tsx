"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store, Loader2, ScanBarcode, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = React.useState("admin@pos.local");
  const [password, setPassword] = React.useState("admin123");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("غلط ای میل یا پاس ورڈ");
        setLoading(false);
        return;
      }
      toast.success("خوش آمدید!");
      router.refresh();
    } catch (err) {
      toast.error("کوئی مسئلہ پیش آیا");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-amber-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-emerald-100">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg">
            <Store className="w-9 h-9 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">دکان POS سسٹم</CardTitle>
          <CardDescription className="text-base">
            اپنا اکاؤنٹ استعمال کر کے لاگ ان ہوں
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ای میل</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pos.local"
                required
                dir="ltr"
                className="text-left"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">پاس ورڈ</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                dir="ltr"
                className="text-left"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "لاگ ان"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ScanBarcode className="w-4 h-4 text-emerald-600" />
              <span>بارکوڈ سکینر سے فروخت</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ملٹی یوزر مینجمنٹ</span>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-muted/50 text-xs space-y-1" dir="ltr">
              <div className="font-semibold">Demo accounts:</div>
              <div>Admin: admin@pos.local / admin123</div>
              <div>Cashier: cashier@pos.local / cashier123</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
