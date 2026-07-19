import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "ADMIN" | "MANAGER" | "CASHIER";
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    id: (session.user as any).id,
    name: session.user.name,
    email: session.user.email,
    role: (session.user as any).role,
  };
}

export async function requireUser(minRole: "CASHIER" | "MANAGER" | "ADMIN" = "CASHIER") {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const order = { CASHIER: 1, MANAGER: 2, ADMIN: 3 };
  if (order[user.role as keyof typeof order] < order[minRole]) {
    throw new Error("Unauthorized");
  }
  return user;
}
