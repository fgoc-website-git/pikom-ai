import "server-only";
import { viewFor, type DB, type User } from "../engine";
export function meFrom(db: DB, s: { id: string; sv: number } | null): User | null {
  const u = s ? db.users.find(x => x.id === s.id) || null : null;
  if (!u || (u.sv || 0) !== s!.sv) return null;
  const org = u.orgId ? db.orgs.find(o => o.id === u.orgId) : null;
  return org?.status === "suspended" ? null : u;
}
export const payload = (db: DB, me: User | null) => ({ db: viewFor(db, me), meId: me?.id || null });
