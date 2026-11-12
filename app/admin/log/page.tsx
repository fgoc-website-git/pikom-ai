"use client";
import { ActivityLog } from "@/components/admin/Content";
import { SuperOnly } from "@/components/admin/Shell";
import { useToast } from "@/components/ui";
export default function Page() { const t = useToast(); return <SuperOnly><ActivityLog toast={t.show} />{t.node}</SuperOnly>; }
