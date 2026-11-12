"use client";
import { useParams } from "next/navigation";
import { InsightDetail } from "@/components/admin/Content";
import { useToast } from "@/components/ui";
export default function Page() { const { id } = useParams<{ id: string }>(); const t = useToast(); return <><InsightDetail id={id} toast={t.show} />{t.node}</>; }
