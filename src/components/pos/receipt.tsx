"use client";

import * as React from "react";
import { Printer, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatMoney, unitLabel } from "@/lib/pos-utils";
import { BarcodeDisplay } from "@/components/barcode/barcode-display";

interface ReceiptProps {
  sale: any;
  settings: any;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function Receipt({ sale, settings, open, onOpenChange }: ReceiptProps) {
  const printRef = React.useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const currency = settings?.currency || "Rs";
  const taxEnabled = !!settings?.taxEnabled;

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=380,height=600");
    if (!win) return;
    win.document.write(`
      <html dir="ltr"><head><title>Receipt ${sale.invoiceNo}</title>
      <style>
        * { font-family: 'Tahoma', sans-serif; box-sizing: border-box; }
        body { margin: 0; padding: 8px; font-size: 12px; color: #000; }
        .center { text-align: center; }
        .row { display: flex; justify-content: space-between; }
        .border { border-top: 1px dashed #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 2px 0; font-size: 11px; }
        th { border-bottom: 1px solid #000; }
        .bold { font-weight: bold; }
        .big { font-size: 14px; font-weight: bold; }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            Sale Successful
          </DialogTitle>
        </DialogHeader>
        <div
          ref={printRef}
          className="bg-white text-black p-4 rounded-lg space-y-2 text-sm"
        >
          <div className="center">
            <div className="big">{settings?.shopName || "POS"}</div>
            {settings?.shopAddress && (
              <div className="text-xs">{settings.shopAddress}</div>
            )}
            {settings?.shopPhone && (
              <div className="text-xs">Phone: {settings.shopPhone}</div>
            )}
          </div>
          <div className="border" />
          <div className="row text-xs">
            <span>Invoice:</span>
            <span>{sale.invoiceNo}</span>
          </div>
          <div className="row text-xs">
            <span>Date:</span>
            <span>{new Date(sale.createdAt).toLocaleString("en-US")}</span>
          </div>
          {sale.customerName && (
            <div className="row text-xs">
              <span>Customer:</span>
              <span>{sale.customerName}</span>
            </div>
          )}
          <div className="border" />
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((it: any) => (
                <tr key={it.id}>
                  <td className="text-xs">
                    {it.name}
                    <div className="text-[10px] opacity-70">
                      {it.price} x {it.quantity} {unitLabel(it.unit)}
                    </div>
                  </td>
                  <td className="text-xs">{it.quantity}</td>
                  <td className="text-xs">
                    {formatMoney(it.lineTotal, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border" />
          <div className="row text-xs">
            <span>Subtotal:</span>
            <span>{formatMoney(sale.subtotal, currency)}</span>
          </div>
          {taxEnabled && sale.taxTotal > 0 && (
            <div className="row text-xs">
              <span>Tax:</span>
              <span>{formatMoney(sale.taxTotal, currency)}</span>
            </div>
          )}
          {sale.discount > 0 && (
            <div className="row text-xs">
              <span>Discount:</span>
              <span>-{formatMoney(sale.discount, currency)}</span>
            </div>
          )}
          <div className="row bold big">
            <span>Total:</span>
            <span>{formatMoney(sale.total, currency)}</span>
          </div>
          <div className="row text-xs">
            <span>Payment:</span>
            <span>
              {sale.paymentMethod === "CASH"
                ? "Cash"
                : sale.paymentMethod === "CARD"
                ? "Card"
                : "Mobile"}{" "}
              ({formatMoney(sale.paidAmount, currency)})
            </span>
          </div>
          {sale.change > 0 && (
            <div className="row text-xs">
              <span>Change:</span>
              <span>{formatMoney(sale.change, currency)}</span>
            </div>
          )}
          <div className="border" />
          <div className="center">
            <BarcodeDisplay
              value={sale.invoiceNo}
              format="CODE128"
              height={36}
              width={1.5}
            />
          </div>
          <div className="center text-xs mt-2">
            {settings?.receiptFooter || "Thank you! Please come again."}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
