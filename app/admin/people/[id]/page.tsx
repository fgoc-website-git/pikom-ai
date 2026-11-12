"use client";
import { useParams } from "next/navigation";
import { PersonDetail } from "@/components/admin/Access";
import { SuperOnly } from "@/components/admin/Shell";
import { useToast } from "@/components/ui";
export default function Page() { const { id } = useParams<{ id: string }>(); const t = useToast(); return <SuperOnly><PersonDetail id={id} toast={t.show} />{t.node}</SuperOnly>; }
