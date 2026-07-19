import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

let seeded = false;

export async function seedIfNeeded() {
  if (seeded) return;
  try {
    const settings = await db.settings.findUnique({ where: { id: "shop" } });
    if (!settings) {
      await db.settings.create({
        data: {
          id: "shop",
          shopName: "میری دکان",
          currency: "Rs",
          receiptFooter: "شکریہ! دوبارہ آئیں۔",
          invoicePrefix: "INV",
        },
      });
    }
    const admin = await db.user.findUnique({ where: { email: "admin@pos.local" } });
    if (!admin) {
      const hash = await bcrypt.hash("admin123", 10);
      await db.user.create({
        data: {
          email: "admin@pos.local",
          name: "ایڈمن",
          password: hash,
          role: "ADMIN",
          active: true,
        },
      });
    }
    const cashier = await db.user.findUnique({ where: { email: "cashier@pos.local" } });
    if (!cashier) {
      const hash = await bcrypt.hash("cashier123", 10);
      await db.user.create({
        data: {
          email: "cashier@pos.local",
          name: "کیشیئر",
          password: hash,
          role: "CASHIER",
          active: true,
        },
      });
    }
    const cats = ["کھانے کی اشیاء", "مشروبات", "گھریلو اشیاء", "صفائی کی اشیاء", "دیگر"];
    for (const name of cats) {
      const exists = await db.category.findUnique({ where: { name } });
      if (!exists) await db.category.create({ data: { name } });
    }
    seeded = true;
  } catch (e) {
    // ignore seeding errors
  }
}
