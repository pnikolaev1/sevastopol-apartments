import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "../_components/AdminShell";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return <AdminShell>{children}</AdminShell>;
}
