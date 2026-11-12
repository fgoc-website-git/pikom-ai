"use client";
// Client store. Data comes from the server (/api/state) and every change is sent to /api/action.
// Screens update instantly by running the same rules locally; the server's answer then replaces it.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { act, makeIds, seatsUsedIn, fullAccess, type ActionName, type DB, type User, type Org, type Result, type Check, type CompanyProfile, type Job, type Rfp, type PEvent, type Content, type Announcement, type Role, type Settings, normalize } from "./engine";
import type { MemberType } from "./options";

export * from "./engine";

const EMPTY: DB = normalize({ orgs: [], individuals: [], users: [], jobs: [], rfps: [], events: [], content: [], announcements: [], spotlight: [], log: [] });
export type ImportRow = { name: string; domain: string; type: MemberType; mainEmail: string; pikomNo: string; renewal: string; category: string; about: string };

type RegisterInput = { email: string; name: string; password: string; jobTitle: string; consent: boolean; asGuest?: boolean; company?: string };
interface Ctx {
  db: DB; me: User | null; myOrg: Org | null; ready: boolean; full: boolean; offline: string | null;
  seatsUsed: (orgId: string) => number; orgUsers: (orgId: string) => User[];
  checkEmail: (email: string) => Promise<Check>;
  register: (d: RegisterInput) => Promise<Result>;
  signIn: (email: string, password: string) => Promise<Result & { me?: User | null }>; signOut: () => Promise<void>;
  changePassword: (current: string, next: string) => Promise<Result>;
  updateMe: (p: Partial<User>) => void;
  updateOrgProfile: (orgId: string, p: Partial<CompanyProfile>) => void;
  removeUser: (userId: string) => void; setMainHolder: (orgId: string, email: string) => Result; setCompanyRole: (userId: string, role: Role) => Result;
  addOrg: (o: { domain: string; name: string; type: MemberType; mainEmail: string; pikomNo: string; renewal: string; category: string; about: string }) => Result;
  updateOrg: (orgId: string, p: Partial<Org>) => Result; removeOrg: (orgId: string) => void;
  addIndividual: (i: { email: string; name: string; pikomNo: string; renewal: string }) => Result; removeIndividual: (email: string) => void;
  addUserAsAdmin: (orgId: string, email: string, name: string, role?: Role) => Result;
  addStaff: (email: string, name: string, level?: "super" | "content") => Result; removeStaff: (id: string) => void;
  postJob: (j: Omit<Job, "id" | "postedOn" | "postedBy" | "orgId" | "company">) => void; deleteJob: (id: string) => void; toggleJob: (id: string) => void;
  postRfp: (r: Omit<Rfp, "id" | "postedOn" | "postedBy" | "orgId" | "buyer" | "status">) => void; updateRfp: (id: string, p: Partial<Rfp>) => void;
  saveEvent: (e: PEvent) => void; deleteEvent: (id: string) => void;
  registerEvent: (eventId: string) => Result; cancelEvent: (eventId: string) => void; markAttended: (eventId: string, userId: string, v: boolean) => void;
  saveContent: (c: Content) => void; deleteContent: (id: string) => void;
  saveAnnouncement: (a: Announcement) => void; deleteAnnouncement: (id: string) => void;
  setSpotlight: (ids: string[]) => void;
  restore: (trashId: string) => Promise<Result>;
  importOrgs: (rows: ImportRow[]) => Result;
  updateSettings: (p: Partial<Settings>) => Result;
  resetPassword: (userId: string) => Result;
  signOutEverywhere: () => Promise<Result>;
  /** The last removal that can be undone (shown by <UndoBar/>). */
  lastUndo: { id: string; msg: string } | null; clearUndo: () => void;
}

const C = createContext<Ctx | null>(null);
const post = async (url: string, body: unknown) => {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" });
  return r.json();
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(EMPTY);
  const [meId, setMeId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState<string | null>(null);
  const [lastUndo, setLastUndo] = useState<{ id: string; msg: string } | null>(null);
  const dbRef = useRef(db); dbRef.current = db;
  const meRef = useRef(meId); meRef.current = meId;
  const pending = useRef(0);

  const apply = (j: any) => { if (j?.db) { setDb(j.db); setMeId(j.meId ?? null); } };
  const refresh = useCallback(async () => {
    if (pending.current) return;
    try {
      const r = await fetch("/api/state", { cache: "no-store", credentials: "same-origin" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      if (!pending.current) apply(j);
      setOffline(null);
    } catch (e: any) { setOffline(e?.message || "Can't reach the server."); }
    setReady(true);
  }, []);
  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    const t = setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 30000);
    return () => { window.removeEventListener("focus", onFocus); clearInterval(t); };
  }, [refresh]);

  const me = db.users.find(u => u.id === meId) || null;
  const myOrg = me?.orgId ? db.orgs.find(o => o.id === me.orgId) || null : null;
  const seatsUsed = useCallback((orgId: string) => seatsUsedIn(db, orgId), [db]);
  const orgUsers = useCallback((orgId: string) => db.users.filter(u => u.orgId === orgId), [db]);

  /** Run locally for an instant screen update, then save on the server (which re-checks everything). */
  const run = (name: ActionName, ...args: any[]): Result => {
    const cur = dbRef.current; const meNow = cur.users.find(u => u.id === meRef.current) || null;
    const ids = makeIds(6);
    const local = act(cur, meNow, name, args, ids);
    if (!local.result.ok) return local.result;
    setDb(local.db);
    if (local.result.undo) setLastUndo({ id: local.result.undo, msg: local.result.msg || "Removed." });
    pending.current++;
    post("/api/action", { name, args, ids })
      .then(j => {
        if (j?.result && !j.result.ok) { setLastUndo(null); window.alert(`${j.result.code}: ${j.result.msg}`); }
        else if (j?.error) window.alert(j.error);
        apply(j);
      })
      .catch(() => window.alert("We couldn't save that change. Check your connection and try again."))
      .finally(() => { pending.current--; });
    return local.result;
  };

  const value: Ctx = {
    db, me, myOrg, ready, full: fullAccess(me), offline, seatsUsed, orgUsers,
    checkEmail: async (email) => (await post("/api/auth", { op: "check", email })).result,
    register: async (d) => { const j = await post("/api/auth", { op: "register", ...d, ids: makeIds(2) }); apply(j); return j.result; },
    signIn: async (email, password) => { const j = await post("/api/auth", { op: "signin", email, password }); apply(j); return { ...j.result, me: j.db?.users.find((u: User) => u.id === j.meId) || null }; },
    signOut: async () => { apply(await post("/api/auth", { op: "signout" })); },
    changePassword: async (current, next) => { const j = await post("/api/auth", { op: "password", current, next }); apply(j); return j.result; },
    updateMe: (p) => { run("updateMe", p); },
    updateOrgProfile: (orgId, p) => { run("updateOrgProfile", orgId, p); },
    removeUser: (id) => { run("removeUser", id); },
    setMainHolder: (orgId, email) => run("setMainHolder", orgId, email),
    setCompanyRole: (id, role) => run("setCompanyRole", id, role),
    addOrg: (o) => run("addOrg", o),
    updateOrg: (orgId, p) => run("updateOrg", orgId, p),
    removeOrg: (id) => { run("removeOrg", id); },
    addIndividual: (i) => run("addIndividual", i),
    removeIndividual: (e) => { run("removeIndividual", e); },
    addUserAsAdmin: (orgId, email, name, role) => run("addUserAsAdmin", orgId, email, name, role || "member"),
    addStaff: (email, name, level) => run("addStaff", email, name, level || "content"),
    removeStaff: (id) => { run("removeStaff", id); },
    postJob: (j) => { run("postJob", j); }, deleteJob: (id) => { run("deleteJob", id); }, toggleJob: (id) => { run("toggleJob", id); },
    postRfp: (r) => { run("postRfp", r); }, updateRfp: (id, p) => { run("updateRfp", id, p); },
    saveEvent: (e) => { run("saveEvent", e); }, deleteEvent: (id) => { run("deleteEvent", id); },
    registerEvent: (id) => run("registerEvent", id), cancelEvent: (id) => { run("cancelEvent", id); },
    markAttended: (eventId, userId, v) => { run("markAttended", eventId, userId, v); },
    saveContent: (c) => { run("saveContent", c); }, deleteContent: (id) => { run("deleteContent", id); },
    saveAnnouncement: (a) => { run("saveAnnouncement", a); }, deleteAnnouncement: (id) => { run("deleteAnnouncement", id); },
    setSpotlight: (ids) => { run("setSpotlight", ids); },
    restore: async (id) => { setLastUndo(null); const j = await post("/api/action", { name: "restore", args: [id], ids: makeIds(2) }); apply(j); return j.result || { ok: false, code: "AX-500", msg: j.error || "Couldn't restore." }; },
    importOrgs: (rows) => run("importOrgs", rows),
    updateSettings: (p) => run("updateSettings", p),
    resetPassword: (id) => run("resetPassword", id),
    signOutEverywhere: async () => { const j = await post("/api/auth", { op: "signoutAll" }); apply(j); return j.result; },
    lastUndo, clearUndo: () => setLastUndo(null),
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useStore() { const c = useContext(C); if (!c) throw new Error("useStore outside provider"); return c; }
