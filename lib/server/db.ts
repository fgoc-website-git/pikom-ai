import "server-only";
import { Pool } from "pg";
import { promises as fs } from "fs";
import path from "path";
import { seed, normalize, type DB } from "../engine";
import { hashPassword } from "./auth";

// The whole site's data is one JSON document in Supabase Postgres (table ax_state), changed inside a
// row-locked transaction so two people saving at once can't overwrite each other.
// Without a database URL (local development) it falls back to a file.

const URL_ = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || "";
let pool: Pool | null = null;
function getPool() {
  if (!pool) {
    // Supabase's certificate chain isn't in Node's store; keep TLS on but skip CA verification.
    const noSsl = /sslmode=disable/.test(URL_);
    let conn = URL_;
    try { const u = new URL(URL_); u.searchParams.delete("sslmode"); conn = u.toString(); } catch {}
    pool = new Pool({ connectionString: conn, ssl: noSsl ? false : { rejectUnauthorized: false }, max: 3 });
  }
  return pool;
}
let ready = false;
async function ensureTable() {
  if (ready) return;
  await getPool().query(`create table if not exists public.ax_state (id text primary key, data jsonb not null, version int not null default 1, updated_at timestamptz not null default now());
    alter table public.ax_state enable row level security;`);
  ready = true;
}

async function freshSeed(): Promise<DB> {
  const d = normalize(seed());
  return { ...d, users: await Promise.all(d.users.map(async u => ({ ...u, password: await hashPassword(u.password) }))) };
}
/** Hash any password that arrived in plain text (new accounts, temporary passwords). */
async function hashNew(d: DB): Promise<DB> {
  if (!d.users.some(u => !u.password.startsWith("s$"))) return d;
  return { ...d, users: await Promise.all(d.users.map(async u => u.password.startsWith("s$") ? u : { ...u, password: await hashPassword(u.password) })) };
}

const FILE = path.join(process.cwd(), ".data", "state.json");

export async function load(): Promise<DB> {
  if (!URL_) {
    try { return normalize(JSON.parse(await fs.readFile(FILE, "utf8"))); } catch { const d = await freshSeed(); await saveFile(d); return d; }
  }
  await ensureTable();
  const r = await getPool().query("select data from public.ax_state where id = 'main'");
  if (r.rows[0]) return normalize(r.rows[0].data as DB);
  return mutate(async d => ({ db: d, out: null })).then(x => x.db);
}
async function saveFile(d: DB) { await fs.mkdir(path.dirname(FILE), { recursive: true }); await fs.writeFile(FILE, JSON.stringify(d)); }

let fileLock: Promise<unknown> = Promise.resolve();
/** Load → change → save, atomically. `fn` returns the new data plus anything to hand back. */
export async function mutate<T>(fn: (d: DB) => Promise<{ db: DB; out: T }> | { db: DB; out: T }): Promise<{ db: DB; out: T }> {
  if (!URL_) {
    const run = fileLock.then(async () => {
      let d: DB; try { d = normalize(JSON.parse(await fs.readFile(FILE, "utf8"))); } catch { d = await freshSeed(); }
      const r = await fn(d); const nd = await hashNew(r.db); await saveFile(nd); return { db: nd, out: r.out };
    });
    fileLock = run.catch(() => {}); return run;
  }
  await ensureTable();
  const c = await getPool().connect();
  try {
    await c.query("begin");
    let row = await c.query("select data from public.ax_state where id = 'main' for update");
    if (!row.rows[0]) {
      await c.query("insert into public.ax_state (id, data) values ('main', $1) on conflict (id) do nothing", [JSON.stringify(await freshSeed())]);
      row = await c.query("select data from public.ax_state where id = 'main' for update");
    }
    const r0 = normalize(row.rows[0].data as DB);
    const r = await fn(r0);
    const nd = await hashNew(r.db);
    if (nd !== r0) await c.query("update public.ax_state set data = $1, version = version + 1, updated_at = now() where id = 'main'", [JSON.stringify(nd)]);
    await c.query("commit");
    return { db: nd, out: r.out };
  } catch (e) { await c.query("rollback").catch(() => {}); throw e; }
  finally { c.release(); }
}
