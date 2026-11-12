"use client";
import { PostsAdmin } from "@/components/admin/Content";
import { useToast } from "@/components/ui";
export default function Page() { const t = useToast(); return <><PostsAdmin toast={t.show} />{t.node}</>; }
