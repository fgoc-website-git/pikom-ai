"use client";
import { HomeAdmin } from "@/components/admin/Content";
import { useToast } from "@/components/ui";
export default function Page() { const t = useToast(); return <><HomeAdmin toast={t.show} />{t.node}</>; }
