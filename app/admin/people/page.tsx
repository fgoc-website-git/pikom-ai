"use client";
import { People } from "@/components/admin/Access";
import { SuperOnly } from "@/components/admin/Shell";
export default function Page() { return <SuperOnly><People /></SuperOnly>; }
