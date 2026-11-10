import { NextResponse } from "next/server";
import { mutate } from "@/lib/server/db";
import { sessionUserId } from "@/lib/server/auth";
import { meFrom, payload } from "@/lib/server/view";
import { act, ACTIONS, type ActionName, type DB, type Result } from "@/lib/engine";
export const dynamic = "force-dynamic";

const allIds = (d: DB) => new Set<string>([...d.users, ...d.orgs, ...d.jobs, ...d.rfps, ...d.events, ...d.content, ...d.announcements].map(x => x.id));

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = body?.name as ActionName;
  if (!body || !ACTIONS.includes(name) || !Array.isArray(body.args)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const rawIds: unknown[] = Array.isArray(body.ids) ? body.ids.slice(0, 10) : [];
  const uid = await sessionUserId();
  try {
    const { db, out } = await mutate<Result>(d => {
      const ids = rawIds.filter((x): x is string => typeof x === "string" && /^[a-z0-9]{8}$/.test(x));
      const used = allIds(d);
      const r = act(d, meFrom(d, uid), name, body.args, ids.filter(x => !used.has(x)));
      return { db: r.result.ok ? r.db : d, out: r.result };
    });
    return NextResponse.json({ result: out, ...payload(db, meFrom(db, uid)) });
  } catch (e) {
    console.error("action", name, e);
    return NextResponse.json({ error: "Could not save. Please try again." }, { status: 503 });
  }
}
