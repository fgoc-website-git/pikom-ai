"use client";
import { Individuals } from "@/components/admin/Access";
import { SuperOnly } from "@/components/admin/Shell";
import { useToast } from "@/components/ui";
export default function Page() { const t = useToast(); return <SuperOnly><Individuals toast={t.show} />{t.node}</SuperOnly>; }
