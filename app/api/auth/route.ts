import { NextResponse } from "next/server";
import { load, mutate } from "@/lib/server/db";
import { sessionUserId, setSession, verifyPassword, hashPassword } from "@/lib/server/auth";
import { meFrom, payload } from "@/lib/server/view";
import { checkEmail, registerUser, stamp, ERR, type Result, type DB } from "@/lib/engine";
export const dynamic = "force-dynamic";

const bad: Result = { ok: false, code: ERR.BAD_LOGIN, msg: "Email or password is incorrect." };
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  try {
    switch (b.op) {
      case "check": {
        const db = await load();
        const r = checkEmail(db, str(b.email));
        const email = str(b.email).trim().toLowerCase();
        const org = r.ok && r.org ? { ...r.org, mainEmail: r.org.mainEmail === email ? email : "", pikomNo: "" } : undefined;
        return NextResponse.json({ result: { ...r, org } });
      }
      case "register": {
        const { db, out } = await mutate<{ result: Result; id?: string }>(d => {
          const r = registerUser(d, { email: str(b.email), name: str(b.name, 120), password: str(b.password, 200), jobTitle: str(b.jobTitle, 120), consent: !!b.consent, asGuest: !!b.asGuest, company: str(b.company, 120) }, Array.isArray(b.ids) ? b.ids.filter((x: unknown) => typeof x === "string" && /^[a-z0-9]{8}$/.test(x as string)).slice(0, 2) : []);
          return { db: r.result.ok ? r.db : d, out: { result: r.result, id: r.user?.id } };
        });
        if (out.result.ok && out.id) await setSession(out.id, 0);
        return NextResponse.json({ result: out.result, ...payload(db, meFrom(db, out.result.ok ? { id: out.id!, sv: 0 } : await sessionUserId())) });
      }
      case "signin": {
        const email = str(b.email).trim().toLowerCase();
        const db0 = await load();
        const u = db0.users.find(x => x.email === email);
        if (!u || !(await verifyPassword(str(b.password), u.password))) { await wait(600); return NextResponse.json({ result: bad, ...payload(db0, null) }); }
        const org = u.orgId ? db0.orgs.find(o => o.id === u.orgId) : null;
        if (org?.status === "suspended") return NextResponse.json({ result: { ok: false, code: ERR.SUSPENDED, msg: `Access for ${org.name} is paused. Please contact the PIKOM secretariat.` }, ...payload(db0, null) });
        const { db } = await mutate(d => ({ db: { ...d, users: d.users.map(x => x.id === u.id ? { ...x, lastSignIn: stamp() } : x) } as DB, out: null }));
        const sess = { id: u.id, sv: u.sv || 0 };
        await setSession(sess.id, sess.sv);
        return NextResponse.json({ result: { ok: true }, ...payload(db, meFrom(db, sess)) });
      }
      case "signout": {
        await setSession(null);
        return NextResponse.json({ result: { ok: true }, ...payload(await load(), null) });
      }
      case "password": {
        const id = await sessionUserId();
        const db0 = await load(); const me = meFrom(db0, id);
        if (!me) return NextResponse.json({ result: { ok: false, code: "AX-401", msg: "Please sign in again." } });
        if (!(await verifyPassword(str(b.current), me.password))) { await wait(600); return NextResponse.json({ result: { ok: false, code: ERR.BAD_LOGIN, msg: "Current password is incorrect." } }); }
        const next = str(b.next, 200);
        if (next.length < 8) return NextResponse.json({ result: { ok: false, code: "AX-107", msg: "New password must be at least 8 characters." } });
        const h = await hashPassword(next); const sv = (me.sv || 0) + 1;
        const { db } = await mutate(d => ({ db: { ...d, users: d.users.map(x => x.id === me.id ? { ...x, password: h, sv } : x) } as DB, out: null }));
        await setSession(me.id, sv);
        return NextResponse.json({ result: { ok: true, msg: "Password updated. You've been signed out on other devices." }, ...payload(db, meFrom(db, { id: me.id, sv })) });
      }
      case "signoutAll": {
        const db0 = await load(); const me = meFrom(db0, await sessionUserId());
        if (!me) return NextResponse.json({ result: { ok: false, code: "AX-401", msg: "Please sign in again." } });
        const sv = (me.sv || 0) + 1;
        const { db } = await mutate(d => ({ db: { ...d, users: d.users.map(x => x.id === me.id ? { ...x, sv } : x) } as DB, out: null }));
        await setSession(me.id, sv);
        return NextResponse.json({ result: { ok: true, msg: "Signed out on all other devices." }, ...payload(db, meFrom(db, { id: me.id, sv })) });
      }
    }
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  } catch (e) {
    console.error("auth", b?.op, e);
    return NextResponse.json({ result: { ok: false, code: "AX-500", msg: "We couldn't reach the server. Please try again." } }, { status: 503 });
  }
}
