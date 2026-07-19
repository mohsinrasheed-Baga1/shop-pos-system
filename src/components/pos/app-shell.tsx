"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Package,
  ScanBarcode,
  Receipt,
  BarChart3,
  Users,
  Settings as SettingsIcon,
  Store,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore, type View } from "@/stores/use-pos-store";
import { PosView } from "@/components/pos/views/pos-view";
import { ProductsView } from "@/components/pos/views/products-view";
import { ScannerView } from "@/components/pos/views/scanner-view";
import { SalesView } from "@/components/pos/views/sales-view";
import { ReportsView } from "@/components/pos/views/reports-view";
import { UsersView } from "@/components/pos/views/users-view";
import { SettingsView } from "@/components/pos/views/settings-view";
import { toast } from "sonner";

interface AppShellProps {
  user: { id: string; name?: string | null; email?: string | null; role: string };
  settings: any;
}

const NAV: { id: View; label: string; icon: any; minRole?: string }[] = [
  { id: "pos", label: "فروخت (POS)", icon: ShoppingCart },
  { id: "scanner", label: "بارکوڈ سکینر", icon: ScanBarcode },
  { id: "products", label: "پروڈکٹس", icon: Package },
  { id: "sales", label: "فروخت کی تاریخ", icon: Receipt },
  { id: "reports", label: "رپورٹس", icon: BarChart3 },
  { id: "users", label: "یوزر مینجمنٹ", icon: Users, minRole: "ADMIN" },
  { id: "settings", label: "سیٹنگز", icon: SettingsIcon, minRole: "ADMIN" },
];

export function AppShell({ user, settings }: AppShellProps) {
  const { view, setView, sidebarOpen, setSidebarOpen } = useAppStore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const roleOrder = { CASHIER: 1, MANAGER: 2, ADMIN: 3 };
  const navItems = NAV.filter(
    (n) => !n.minRole || roleOrder[user.role as keyof typeof roleOrder] >= roleOrder[n.minRole as keyof typeof roleOrder]
  );

  async function handleSignOut() {
    await signOut({ redirect: false });
    toast.success("لاگ آؤٹ ہو گئے");
    router.refresh();
  }

  function renderView() {
    switch (view) {
      case "pos":
        return <PosView settings={settings} />;
      case "scanner":
        return <ScannerView />;
      case "products":
        return <ProductsView userRole={user.role} />;
      case "sales":
        return <SalesView />;
      case "reports":
        return <ReportsView />;
      case "users":
        return user.role === "ADMIN" ? <UsersView /> : <PosView settings={settings} />;
      case "settings":
        return user.role === "ADMIN" ? <SettingsView /> : <PosView settings={settings} />;
      default:
        return <PosView settings={settings} />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Top bar (mobile) */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-background border-b px-4 h-14">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          aria-label="menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2 font-bold">
          <Store className="w-5 h-5 text-emerald-600" />
          {settings?.shopName || "POS"}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="theme"
        >
          {mounted && theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed lg:sticky top-0 right-0 z-50 h-screen w-72 bg-background border-l flex flex-col transition-transform lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <div className="font-bold text-sm">
                  {settings?.shopName || "POS"}
                </div>
                <div className="text-xs text-muted-foreground">
                  دکان کا سسٹم
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-right",
                    active
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-right">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t space-y-2">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">
                {user.name?.[0] || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user.name}</div>
                <div className="text-xs text-muted-foreground">
                  {user.role === "ADMIN" ? "ایڈمن" : user.role === "MANAGER" ? "مینجر" : "کیشیئر"}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {mounted && theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4 ml-1" /> لائٹ
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 ml-1" /> ڈارک
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 ml-1" /> لاگ آؤٹ
              </Button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 min-h-screen flex flex-col">
          <div className="flex-1 p-4 lg:p-6">{renderView()}</div>
          <footer className="mt-auto border-t bg-background py-3 px-4 text-center text-xs text-muted-foreground">
            {settings?.shopName || "POS System"} • بنا گیا Z.ai کے ساتھ • تمام حقوق محفوظ ہیں
          </footer>
        </main>
      </div>
    </div>
  );
}
