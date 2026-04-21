import { NextRequest } from "next/server";
import { getDownload } from "@/lib/download-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  const entry = token ? getDownload(token) : null;

  if (!entry) {
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Download Expired — MMC</title>
  <style>
    :root { color-scheme: light; }
    html, body { margin: 0; height: 100%; font-family: Montserrat, Arial, Helvetica, sans-serif; background: #F7F5F0; color: #1A1A1A; }
    main { min-height: 100%; display: grid; place-items: center; padding: 24px; }
    .card { max-width: 480px; width: 100%; background: #fff; border: 1px solid #E5E2DC; border-radius: 8px; padding: 32px; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
    h1 { font-size: 20px; margin: 0 0 12px; }
    p  { font-size: 14px; color: #6B6B6B; line-height: 1.6; margin: 0 0 16px; }
    a  { color: #0B1220; font-weight: 600; text-decoration: underline; text-decoration-color: #C9A961; text-underline-offset: 4px; }
  </style>
</head>
<body>
  <main>
    <div class="card">
      <h1>Download link expired</h1>
      <p>This download link has expired or is no longer available.</p>
      <p>Please contact <a href="mailto:mediastrategy@mmc.us">mediastrategy@mmc.us</a> to request your brief copy.</p>
    </div>
  </main>
</body>
</html>`;
    return new Response(html, {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const body = new Uint8Array(entry.buffer);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${entry.filename}"`,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
