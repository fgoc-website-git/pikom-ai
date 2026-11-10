import { NextResponse } from "next/server";
import { load } from "@/lib/server/db";
import { sessionUserId } from "@/lib/server/auth";
import { meFrom, payload } from "@/lib/server/view";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await load();
    return NextResponse.json(payload(db, meFrom(db, await sessionUserId())));
  } catch (e) {
    console.error("state", e);
    return NextResponse.json({ error: "Could not reach the database." }, { status: 503 });
  }
}
