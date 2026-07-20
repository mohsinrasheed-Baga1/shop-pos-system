"use client";

import * as React from "react";
import {
  Bell,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  RefreshCw,
  DownloadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/stores/use-pos-store";

interface NotificationItem {
  id?: string;
  productId?: string;
  name: string;
  barcode?: string;
  stock?: number;
  storeStock?: number;
  minStock?: number;
  expiryDate?: string | null;
  unit?: string;
}

interface NotificationsResponse {
  lowStock: NotificationItem[];
  expiringSoon: NotificationItem[];
  expired: NotificationItem[];
  counts: {
    lowStock: number;
    expiringSoon: number;
    expired: number;
    total: number;
  };
}

interface UpdateInfo {
  version: string;
  releaseUrl?: string;
  changelog?: string[];
}

const CURRENT_VERSION = "2.4.0";
const UPDATE_URL =
  "https://raw.githubusercontent.com/mohsinrasheed-Baga1/shop-pos-system/main/public/update.json";

// Compare semantic versions. Returns true if remote > current.
function isNewer(remote: string, current: string): boolean {
  const parse = (v: string) =>
    v
      .split(".")
      .map((x) => parseInt(x.replace(/\D/g, "") || "0", 10))
      .slice(0, 3);
  const r = parse(remote);
  const c = parse(current);
  for (let i = 0; i < 3; i++) {
    const ri = r[i] || 0;
    const ci = c[i] || 0;
    if (ri > ci) return true;
    if (ri < ci) return false;
  }
  return false;
}

export function NotificationsBell() {
  const { setView } = useAppStore();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [notifications, setNotifications] = React.useState<NotificationsResponse | null>(
    null
  );
  const [update, setUpdate] = React.useState<UpdateInfo | null>(null);

  const loadNotifications = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as NotificationsResponse;
      setNotifications(data);
    } catch {
      // silently ignore — non-blocking
    } finally {
      setLoading(false);
    }
  }, []);

  const checkForUpdate = React.useCallback(async () => {
    try {
      const res = await fetch(UPDATE_URL, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as UpdateInfo;
      if (data.version && isNewer(data.version, CURRENT_VERSION)) {
        setUpdate(data);
      } else {
        setUpdate(null);
      }
    } catch {
      // ignore network errors silently
    }
  }, []);

  React.useEffect(() => {
    loadNotifications();
    checkForUpdate();
    const interval = window.setInterval(() => {
      loadNotifications();
      checkForUpdate();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [loadNotifications, checkForUpdate]);

  const total =
    (notifications?.counts?.total || 0) + (update ? 1 : 0);

  function handleNavigate() {
    setOpen(false);
    setView("products");
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={`Notifications${total > 0 ? ` (${total})` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {total > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-background">
              {total > 99 ? "99+" : total}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96"
        sideOffset={6}
      >
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold">Notifications</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => {
              setLoading(true);
              loadNotifications();
              checkForUpdate();
            }}
            aria-label="Refresh notifications"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="text-sm font-medium">All good — no alerts</p>
            <p className="text-xs text-muted-foreground">
              Stock levels and expiry dates are healthy
            </p>
          </div>
        ) : (
          <div className="max-h-[28rem] overflow-y-auto">
            {/* Low Stock section */}
            {notifications && notifications.lowStock.length > 0 && (
              <>
                <DropdownMenuLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  Low Stock
                  <Badge
                    variant="outline"
                    className="ml-auto border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300"
                  >
                    {notifications.lowStock.length}
                  </Badge>
                </DropdownMenuLabel>
                {notifications.lowStock.slice(0, 6).map((item, idx) => (
                  <DropdownMenuItem
                    key={item.id || item.productId || `ls-${idx}`}
                    className="flex items-center gap-2 py-2"
                    onClick={handleNavigate}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stock:{" "}
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          {item.stock ?? 0}
                        </span>{" "}
                        / min {item.minStock ?? 0}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
                {notifications.lowStock.length > 6 && (
                  <DropdownMenuItem
                    className="justify-center text-xs text-emerald-700 dark:text-emerald-400"
                    onClick={handleNavigate}
                  >
                    +{notifications.lowStock.length - 6} more — View all
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}

            {/* Expiring Soon section */}
            {notifications && notifications.expiringSoon.length > 0 && (
              <>
                <DropdownMenuLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-rose-600" />
                  Expiring Soon
                  <Badge
                    variant="outline"
                    className="ml-auto border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300"
                  >
                    {notifications.expiringSoon.length}
                  </Badge>
                </DropdownMenuLabel>
                {notifications.expiringSoon.slice(0, 6).map((item, idx) => {
                  const exp = item.expiryDate
                    ? new Date(item.expiryDate)
                    : null;
                  const daysLeft = exp
                    ? Math.ceil(
                        (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      )
                    : null;
                  return (
                    <DropdownMenuItem
                      key={item.id || item.productId || `es-${idx}`}
                      className="flex items-center gap-2 py-2"
                      onClick={handleNavigate}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {exp
                            ? exp.toLocaleDateString("en-PK", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                          {daysLeft !== null && daysLeft >= 0 && (
                            <span className="ml-1 text-rose-600 dark:text-rose-400">
                              • {daysLeft}d left
                            </span>
                          )}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
                {notifications.expiringSoon.length > 6 && (
                  <DropdownMenuItem
                    className="justify-center text-xs text-emerald-700 dark:text-emerald-400"
                    onClick={handleNavigate}
                  >
                    +{notifications.expiringSoon.length - 6} more — View all
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}

            {/* Software update section */}
            {update && (
              <>
                <DropdownMenuLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <DownloadCloud className="h-3.5 w-3.5 text-emerald-600" />
                  Software Update
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="flex items-start gap-2 py-2"
                  onClick={() => {
                    setOpen(false);
                    if (update.releaseUrl) {
                      window.open(update.releaseUrl, "_blank");
                    } else {
                      setView("settings");
                    }
                  }}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <DownloadCloud className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      Version {update.version} available
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You are on {CURRENT_VERSION}. Click to view release notes.
                    </p>
                  </div>
                </DropdownMenuItem>
              </>
            )}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-xs text-emerald-700 dark:text-emerald-400"
          onClick={handleNavigate}
        >
          Manage products
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
