import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminHeader from "@/components/AdminHeader";
import NewBriefClient from "./NewBriefClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function NewBriefPage() {
  if (!isAdminAuthenticated()) redirect("/admin");

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-8">
        <div className="mb-6">
          <div className="mmc-kicker mb-2">Admin · New Brief</div>
          <h1 className="text-3xl font-bold tracking-tight text-mmc-purple sm:text-4xl">
            Create Brief
          </h1>
          <span className="mmc-rule mt-3 block" />
        </div>

        <NewBriefClient />
      </main>
    </div>
  );
}
