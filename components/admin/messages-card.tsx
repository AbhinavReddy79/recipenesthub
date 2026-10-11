"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { useAdminPowers } from "@/lib/storage/admin-powers";
import { countOpenMessages } from "@/lib/storage/messages";
import { cn } from "@/lib/utils";

/** Dashboard banner: Contact messages waiting for a reply (admins with the Messages power). */
export function MessagesCard() {
  const { messages: canRead } = useAdminPowers();
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (!canRead) return;
    let cancelled = false;
    countOpenMessages().then((n) => !cancelled && setOpen(n));
    return () => {
      cancelled = true;
    };
  }, [canRead]);

  if (!canRead || open === null) return null;

  return (
    <Link
      href="/admin/messages"
      className={cn(
        "group flex flex-wrap items-center gap-4 rounded-2xl border p-5 shadow-soft transition-colors",
        open > 0 ? "border-primary/40 bg-primary/10 hover:bg-primary/15" : "bg-card hover:border-primary/30",
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Inbox className="size-5" aria-hidden />
      </span>
      <span className="grid flex-1">
        <span className="font-semibold">
          {open > 0 ? `${open} ${open === 1 ? "message needs" : "messages need"} a reply` : "No messages waiting"}
        </span>
        <span className="text-sm text-muted-foreground">Complaints and questions from the Contact page. Reply to them from the inbox.</span>
      </span>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        Open inbox
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}
