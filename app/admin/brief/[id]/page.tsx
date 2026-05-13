import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getBriefById, isAirtableConfigured } from "@/lib/airtable";
import AdminHeader from "@/components/AdminHeader";
import { getProductionUrl } from "@/lib/config";
import BriefEditorClient from "./BriefEditorClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BriefDetailPage({ params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) redirect("/admin");

  if (!isAirtableConfigured()) {
    return (
      <div className="flex min-h-screen flex-col">
        <AdminHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-8">
          <div className="rounded-lg border border-mmc-error/30 bg-mmc-error/5 p-6 text-sm">
            <div className="mb-1 font-semibold text-mmc-error">Airtable is not configured</div>
            <div className="text-mmc-text">
              Set AIRTABLE_PAT and AIRTABLE_BASE_ID in Vercel environment variables, then redeploy.
            </div>
          </div>
        </main>
      </div>
    );
  }

  const record = await getBriefById(params.id);
  if (!record) notFound();

  const baseUrl = getProductionUrl().replace(/\/$/, "");
  const prospectLink = record.token ? `${baseUrl}/form?token=${encodeURIComponent(record.token)}` : "";

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mmc-kicker mb-2">Admin · Brief</div>
            <h1 className="text-3xl font-bold tracking-tight text-mmc-purple sm:text-4xl">
              {record.companyName || "(unnamed)"}
            </h1>
            <span className="mmc-rule mt-3 block" />
          </div>
          <Link
            href="/admin/dashboard"
            className="rounded-md border border-mmc-border bg-white px-3.5 py-1.5 text-xs font-medium text-mmc-text transition hover:bg-mmc-creamDeep/40"
          >
            ← Dashboard
          </Link>
        </div>

        <BriefEditorClient initialRecord={record} prospectLink={prospectLink} />
      </main>
    </div>
  );
}
