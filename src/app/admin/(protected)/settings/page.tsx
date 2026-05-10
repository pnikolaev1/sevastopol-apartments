import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import PasswordChangeForm from "./_PasswordChangeForm";
import TotpSetup from "./_TotpSetup";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: { email: true, totpEnabled: true },
  });

  if (!admin) redirect("/admin/login");

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Account</h2>
        <p className="text-sm text-gray-700">{admin.email}</p>
      </div>

      <PasswordChangeForm />

      <TotpSetup totpEnabled={admin.totpEnabled} />
    </div>
  );
}
