"use client";
import { Companies } from "@/components/admin/Access";
import { SuperOnly } from "@/components/admin/Shell";
import { useToast } from "@/components/ui";
export default function Page() { const t = useToast(); return <SuperOnly><Companies toast={t.show} />{t.node}</SuperOnly>; }
