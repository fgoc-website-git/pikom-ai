import "server-only";
import { scrypt, randomBytes, timingSafeEqual, createHmac } from "crypto";
import { cookies } from "next/headers";

const run = (pw: string, salt: Buffer) => new Promise<Buffer>((res, rej) => scrypt(pw, salt, 32, (e, k) => (e ? rej(e) : res(k))));
export async function hashPassword(pw: string) { const salt = randomBytes(16); return `s$${salt.toString("hex")}$${(await run(pw, salt)).toString("hex")}`; }
export async function verifyPassword(pw: string, stored: string) {
  const [tag, salt, hash] = stored.split("$"); if (tag !== "s" || !salt || !hash) return false;
  const k = await run(pw, Buffer.from(salt, "hex")); const h = Buffer.from(hash, "hex");
  return h.length === k.length && timingSafeEqual(h, k);
}

const SECRET = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "local-dev-only-secret";
const COOKIE = "ax_session";
const DAYS = 14;
const sign = (s: string) => createHmac("sha256", SECRET).update(s).digest("base64url");

export async function sessionUserId(): Promise<string | null> {
  const v = (await cookies()).get(COOKIE)?.value; if (!v) return null;
  const [id, exp, sig] = v.split("."); if (!id || !exp || !sig) return null;
  const good = sign(`${id}.${exp}`);
  if (good.length !== sig.length || !timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return null;
  return Number(exp) > Date.now() ? id : null;
}
export async function setSession(id: string | null) {
  const jar = await cookies();
  if (!id) { jar.delete(COOKIE); return; }
  const exp = String(Date.now() + DAYS * 864e5);
  jar.set(COOKIE, `${id}.${exp}.${sign(`${id}.${exp}`)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: DAYS * 86400 });
}
