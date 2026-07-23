"use client";

import * as React from "react";
import { Receipt, Plus, Trash2, RefreshCw, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatMoney } from "@/lib/pos-utils";

const CATEGORIES = [
  { v: "rent", l: "Rent / کرایہ" },
  { v: "electricity", l: "Electricity / بجلی" },
  { v: "salary", l: "Salary / تنخواہ" },
  { v: "supplies", l: "Supplies / سامان" },
  { v: "transport", l: "Transport / سواری" },
  { v: "general", l: "General / عام" },
];

export function ExpensesView() {
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", amount: "", category: "general", note: "", date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = React.useState(false);
  const [filter, setFilter] = React.useState("all");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/expenses", { cache: "no-store" });
      const data = await res.json();
      setExpenses(data.expenses || []);
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!form.title.trim() || !form.amount) {
      toast.error("Title and amount required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed"); setSaving(false); return; }
      toast.success("Expense added");
      setDialogOpen(false);
      setForm({ title: "", amount: "", category: "general", note: "", date: new Date().toISOString().slice(0, 10) });
      load();
    } catch { toast.error("Network error"); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      toast.success("Expense deleted");
      load();
    } catch { toast.error("Failed"); }
  }

  const filtered = filter === "all" ? expenses : expenses.filter((e) => e.category === filter);
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-red-500" />
            Expenses (اخراجات)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track shop expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Expenses</div><div className="text-xl font-bold text-red-600">{formatMoney(total)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Count</div><div className="text-xl font-bold">{filtered.length}</div></CardContent></Card>
      </div>

      <div className="flex gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground"><TrendingDown className="w-10 h-10 mx-auto mb-2 opacity-50" />No expenses found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.title}{e.note && <div className="text-xs text-muted-foreground">{e.note}</div>}</TableCell>
                      <TableCell><Badge variant="outline">{CATEGORIES.find((c) => c.v === e.category)?.l || e.category}</Badge></TableCell>
                      <TableCell className="text-xs">{new Date(e.date).toLocaleDateString("en-US")}</TableCell>
                      <TableCell className="text-right font-bold text-red-600">{formatMoney(e.amount)}</TableCell>
                      <TableCell className="text-right"><Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleDelete(e.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Shop rent" /></div>
            <div className="space-y-2"><Label>Amount *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 5000" className="text-left" /></div>
            <div className="space-y-2"><Label>Category</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="text-left" /></div>
            <div className="space-y-2"><Label>Note</Label><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
