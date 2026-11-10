import "server-only";
import { viewFor, type DB, type User } from "../engine";
export function meFrom(db: DB, id: string | null): User | null {
  const u = id ? db.users.find(x => x.id === id) || null : null;
  if (!u) return null;
  const org = u.orgId ? db.orgs.find(o => o.id === u.orgId) : null;
  return org?.status === "suspended" ? null : u;
}
export const payload = (db: DB, me: User | null) => ({ db: viewFor(db, me), meId: me?.id || null });
