import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isAirtableConfigured, listBriefs } from "@/lib/airtable";
import type { BriefRecord } from "@/lib/airtable";
import AdminHeader from "@/components/AdminHeader";
import { Plus } from "lucide-react";
import { getProductionUrl } from "@/lib/config";
import DashboardActions from "./DashboardActions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function statusPill(status: BriefRecord["status"]) {
  const palette: Record<BriefRecord["status"], string> = {
    Draft: "bg-mmc-border text-mmc-text",
    Sent: "bg-mmc-gold/20 text-mmc-gold",
    Submitted: "bg-mmc-success/15 text-mmc-success",
    Expired: "bg-mmc-error/15 text-mmc-error",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${palette[status]}`}
    >
      {status}
    </span>
  );
}

export default async function DashboardPage() {
  if (!isAdminAuthenticated()) redirect("/admin");

  let briefs: BriefRecord[] = [];
  let loadError: string | null = null;
  let airtableMissing = false;

  if (!isAirtableConfigured()) {
    airtableMissing = true;
  } else {
    try {
      briefs = await listBriefs();
    } catch (err) {
      loadError = err instanceof Error ? err.message : "Failed to load briefs";
    }
  }

  const baseUrl = getProductionUrl().replace(/\/$/, "");

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mmc-kicker mb-2">Admin · Dashboard</div>
            <h1 className="text-3xl font-bold tracking-tight text-mmc-purple sm:text-4xl">
              Briefs
            </h1>
            <span className="mmc-rule mt-3 block" />
          </div>
          <Link
            href="/admin/new"
            className="inline-flex items-center gap-2 rounded-md bg-mmc-purple px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-mmc-cream"
          >
            <Plus size={14} aria-hidden="true" />
            New Brief
          </Link>
        </div>

        {airtableMissing ? (
          <ConfigBanner
            title="Airtable is not configured"
            body="Set AIRTABLE_PAT and AIRTABLE_BASE_ID in Vercel environment variables, then redeploy. Until then, briefs cannot be listed or created."
          />
        ) : loadError ? (
          <ConfigBanner title="Could not load briefs" body={loadError} />
        ) : briefs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-lg border border-mmc-border bg-white shadow-[0_1px_2px_rgba(42,18,48,0.04),0_8px_24px_-8px_rgba(42,18,48,0.12)]">
            <table className="w-full">
              <thead className="border-b border-mmc-border bg-mmc-creamDeep/30">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-mmc-muted">
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Prospect</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Sent</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {briefs.map((b, i) => (
                  <tr
                    key={b.id}
                    className={`text-sm text-mmc-text ${
                      i !== briefs.length - 1 ? "border-b border-mmc-border" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/brief/${b.id}`}
                        className="font-semibold text-mmc-purple hover:underline"
                      >
                        {b.companyName || "(unnamed)"}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-mmc-text">{b.prospectName || "—"}</div>
                      {b.prospectEmail ? (
                        <div className="text-xs text-mmc-muted">{b.prospectEmail}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">{statusPill(b.status)}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-mmc-muted">
                      {fmtDate(b.createdAt)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-mmc-muted">
                      {fmtDate(b.sentAt)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-mmc-muted">
                      {fmtDate(b.submittedAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <DashboardActions
                        briefId={b.id}
                        token={b.token}
                        baseUrl={baseUrl}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function ConfigBanner({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-mmc-error/30 bg-mmc-error/5 p-6">
      <div className="mb-1 text-sm font-semibold text-mmc-error">{title}</div>
      <div className="text-sm text-mmc-text">{body}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-mmc-border bg-white/70 p-16 text-center">
      <div className="mmc-kicker mb-2">No Briefs Yet</div>
      <h2 className="text-xl font-semibold text-mmc-purple">Create your first brief</h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-mmc-muted">
        Start by capturing a prospect&apos;s name, email, and company. You can pre-fill the rest
        with Granola notes and Claude later.
      </p>
      <Link
        href="/admin/new"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-mmc-purple px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-110"
      >
        <Plus size={14} aria-hidden="true" />
        New Brief
      </Link>
    </div>
  );
}
