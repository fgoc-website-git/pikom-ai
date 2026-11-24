import { NextResponse } from "next/server";
import { load } from "@/lib/server/db";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Download a published write-up's PDF as a file (not opened in the browser).
 *  Only the PDF link stored on that Insights item is used, so this can't fetch arbitrary URLs.
 *  If the source can't be fetched, falls back to opening the PDF link. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await load();
  const c = db.content.find(x => x.id === id && x.published);
  if (!c?.fileUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const base = new URL(req.url);
  const src = new URL(c.fileUrl, base.origin);
  if (src.origin === base.origin) return NextResponse.redirect(src, 302); // same-site files download via the link itself
  if (src.protocol !== "https:") return NextResponse.redirect(src, 302);
  const name = (decodeURIComponent(src.pathname.split("/").pop() || "") || c.title).replace(/[^\w.\- ]+/g, "_").replace(/(\.pdf)?$/i, ".pdf");
  try {
    const r = await fetch(src, { redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "User-Agent": "AI-Xchange-Malaysia/1.0 (+https://aixchange.org.my)" } });
    const type = r.headers.get("content-type") || "";
    const size = Number(r.headers.get("content-length") || 0);
    if (!r.ok || !r.body || !/pdf|octet-stream/i.test(type) || size > 60_000_000) return NextResponse.redirect(src, 302);
    return new Response(r.body, { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}"`,
      ...(size ? { "Content-Length": String(size) } : {}),
      "Cache-Control": "public, max-age=86400",
    } });
  } catch {
    return NextResponse.redirect(src, 302);
  }
}
