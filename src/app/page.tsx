import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { LoginScreen } from "@/components/pos/login-screen";
import { AppShell } from "@/components/pos/app-shell";
import { seedIfNeeded } from "@/lib/seed";

export default async function Home() {
  // ensure admin + settings exist
  await seedIfNeeded();

  const session = await getServerSession(authOptions);
  if (!session) {
    return <LoginScreen />;
  }

  const settings = await db.settings.findUnique({ where: { id: "shop" } });
  const user = {
    id: (session.user as any).id,
    name: session.user.name,
    email: session.user.email,
    role: (session.user as any).role,
  };

  return <AppShell user={user} settings={settings} />;
}
