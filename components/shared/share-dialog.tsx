"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ShareTarget {
  title: string;
  text: string;
  /** Path (e.g. /recipes/slug) or absolute URL. */
  url: string;
}

function absolute(url: string) {
  return new URL(url, window.location.origin).toString();
}

/** Small brand marks drawn inline (Lucide no longer ships brand icons). */
const Brand = {
  whatsapp: (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.6-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" className="size-4.5" fill="currentColor" aria-hidden>
      <path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
    </svg>
  ),
};

interface ShareDialogProps extends ShareTarget {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ open, onOpenChange, title, text, url }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const link = typeof window === "undefined" ? url : absolute(url);
  const encodedLink = encodeURIComponent(link);
  const encodedText = encodeURIComponent(`${title} — ${text}`);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy automatically — select the link and copy it.");
    }
  };

  const targets: Array<{ label: string; href: string; icon: ReactNode; tone: string }> = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedText}%20${encodedLink}`, icon: Brand.whatsapp, tone: "bg-[#25d366] text-white" },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`, icon: Brand.facebook, tone: "bg-[#1877f2] text-white" },
    { label: "X", href: `https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodedLink}`, icon: Brand.x, tone: "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" },
    { label: "Email", href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}%0A%0A${encodedLink}`, icon: <Mail className="size-5" aria-hidden />, tone: "bg-muted text-foreground" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Share</DialogTitle>
          <DialogDescription className="line-clamp-2">{title}</DialogDescription>
        </DialogHeader>
        <ul className="grid grid-cols-4 gap-3">
          {targets.map((t) => (
            <li key={t.label}>
              <a
                href={t.href}
                target={t.label === "Email" ? undefined : "_blank"}
                rel="noopener noreferrer"
                onClick={() => onOpenChange(false)}
                className="group grid justify-items-center gap-2 rounded-xl p-2 text-xs font-medium transition-colors hover:bg-muted"
              >
                <span className={`flex size-12 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${t.tone}`}>
                  {t.icon}
                </span>
                {t.label}
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="grid gap-1.5">
          <label htmlFor="share-link" className="text-sm font-medium">
            Link
          </label>
          <div className="flex gap-2">
            <Input id="share-link" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
            <Button onClick={copy} className="h-10 shrink-0" aria-live="polite">
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Share button: native share sheet on touch devices that support it, our dialog everywhere else. */
export function ShareButton({ title, text, url, children }: ShareTarget & { children: (open: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);

  const share = async () => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url: absolute(url) });
        return;
      } catch (error) {
        if ((error as DOMException).name === "AbortError") return;
      }
    }
    setOpen(true);
  };

  return (
    <>
      {children(() => void share())}
      <ShareDialog open={open} onOpenChange={setOpen} title={title} text={text} url={url} />
    </>
  );
}

