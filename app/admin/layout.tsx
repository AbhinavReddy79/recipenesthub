import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { features } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · RecipeNest" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!features.admin) notFound();
  return (
    <div className="container-page grid gap-8 py-8 pb-24 lg:grid-cols-[220px_1fr] lg:gap-10">
      <aside className="grid content-start gap-5 lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center gap-2.5 rounded-xl border bg-card p-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-herb text-herb-foreground">
            <ShieldCheck className="size-4.5" aria-hidden />
          </span>
          <div className="grid text-sm">
            <span className="font-semibold">Admin console</span>
            <span className="text-xs text-muted-foreground">Data stored in this browser</span>
          </div>
        </div>
        <AdminNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
