// Shared types for POS system

export type Role = "ADMIN" | "MANAGER" | "CASHIER";

export type PaymentMethod = "CASH" | "CARD" | "MOBILE" | "SHOP_CARD";

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
  wholesalePrice: number;
  unit: string;
  stock: number;
  storeStock: number;
  minStock: number;
  taxRate: number;
  expiryDate: string | null;
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
  cardId?: string | null;
  card?: { name: string; cardNumber: string } | null;
  customerName: string | null;
  customerPhone: string | null;
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  change: number;
  paymentMethod: string;
  saleType: string;
  status: string;
  originalSaleId?: string | null;
  note: string | null;
  createdAt: string;
  items: SaleItem[];
  returns?: SaleReturn[];
}

export interface SaleReturn {
  id: string;
  saleId: string;
  userId: string;
  amount: number;
  reason: string | null;
  restocked: boolean;
  createdAt: string;
}

export interface Settings {
  id: string;
  shopName: string;
  subName: string | null;
  logo: string | null;
  shopAddress: string | null;
  shopPhone: string | null;
  currency: string;
  taxEnabled: boolean;
  defaultTax: number;
  receiptFooter: string | null;
  invoicePrefix: string;
  printerWidth: number;
  backupPasswordHash: string | null;
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

export type CardType = "REGULAR" | "WHOLESALE";

export interface CustomerCard {
  id: string;
  cardNumber: string;
  name: string;
  phone: string | null;
  address: string | null;
  type: CardType;
  balance: number;
  totalPurchases: number;
  totalPaid: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  type: "PURCHASE" | "PAYMENT" | "DEPOSIT" | "WITHDRAW";
  amount: number;
  description: string | null;
  saleId: string | null;
  createdAt: string;
}

export interface StoreTransaction {
  id: string;
  productId: string;
  type: "INCOMING" | "TRANSFER" | "ADJUSTMENT";
  quantity: number;
  note: string | null;
  createdAt: string;
}
