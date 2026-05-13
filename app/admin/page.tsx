import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminLoginClient from "./AdminLoginClient";
import AdminHeader from "@/components/AdminHeader";

export const dynamic = "force-dynamic";

export default function AdminEntryPage() {
  // If already signed in, bounce to the dashboard.
  if (isAdminAuthenticated()) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader showSignOut={false} />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <AdminLoginClient />
      </main>
    </div>
  );
}
