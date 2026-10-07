import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  published: "bg-herb-soft text-secondary-foreground",
  active: "bg-herb-soft text-secondary-foreground",
  pending: "bg-saffron/20 text-foreground",
  draft: "bg-muted text-muted-foreground",
  flagged: "bg-destructive/12 text-destructive",
  rejected: "bg-destructive/12 text-destructive",
  suspended: "bg-destructive/12 text-destructive",
  hidden: "bg-muted text-muted-foreground",
  creator: "bg-terracotta-soft text-accent-foreground",
  admin: "bg-foreground text-background",
  member: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        TONES[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {status}
    </span>
  );
}
