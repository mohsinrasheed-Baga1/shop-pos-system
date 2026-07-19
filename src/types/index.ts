// Shared types for POS system

export type Role = "ADMIN" | "MANAGER" | "CASHIER";

export type PaymentMethod = "CASH" | "CARD" | "MOBILE";

export type Unit = "piece" | "kg" | "gram" | "litre" | "ml" | "dozen" | "metre" | "feet";

export interface Product {
  id: string;
  name: string;
  barcode: string;
  barcodeType: string;
  categoryId: string | null;
  category?: Category | null;
  costPrice: number;
  salePrice: number;
  unit: string;
  stock: number;
  minStock: number;
  taxRate: number;
  hasBarcode: boolean;
  image: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  name: string;
  barcode: string;
  price: number;
  costPrice: number;
  quantity: number;
  unit: string;
  taxRate: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  userId: string;
  user?: { name: string };
  customerName: string | null;
  customerPhone: string | null;
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  change: number;
  paymentMethod: string;
  status: string;
  note: string | null;
  createdAt: string;
  items: SaleItem[];
}

export interface Settings {
  id: string;
  shopName: string;
  shopAddress: string | null;
  shopPhone: string | null;
  currency: string;
  taxEnabled: boolean;
  defaultTax: number;
  receiptFooter: string | null;
  invoicePrefix: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  active: boolean;
  createdAt: string;
}
