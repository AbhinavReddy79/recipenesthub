"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { ContactTopic } from "@/lib/supabase/database.types";
import { CONTACT_TOPICS, sendContactMessage } from "@/lib/storage/messages";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Contact form: anyone can write in; messages arrive in Admin → Messages. */
export function ContactForm({ defaultTopic = "general" }: { defaultTopic?: ContactTopic }) {
  const { user } = useCurrentUser();
  const [form, setForm] = useState({ name: "", email: "", topic: defaultTopic, message: "" });
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "message" | "form", string>>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Signed-in members don't need to retype their name and email.
  const name = form.name || user?.name || "";
  const email = form.email || user?.email || "";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (!EMAIL.test(email.trim())) next.email = "Please enter a valid email so we can reply.";
    if (form.message.trim().length < 10) next.message = "Please write at least a sentence (10 characters).";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    const result = await sendContactMessage({
      name: name.trim().slice(0, 80),
      email: email.trim().slice(0, 254),
      topic: form.topic,
      message: form.message.trim().slice(0, 2000),
    });
    setSending(false);
    if (!result.ok) return setErrors({ form: result.error });
    setSent(true);
  };

  if (sent) {
    return (
      <div role="status" className="grid justify-items-center gap-3 rounded-3xl bg-card p-10 text-center shadow-card ring-1 ring-border/70">
        <CircleCheck className="size-12 text-herb" aria-hidden />
        <h2 className="text-2xl font-semibold">Message sent</h2>
        <p className="max-w-sm text-muted-foreground">
          {user
            ? "Thanks for getting in touch. We reply within 2 working days: you'll find our answer under Support messages in your account menu."
            : "Thanks for getting in touch. We reply by email within 2 working days."}
        </p>
        {user && (
          <Button asChild variant="outline">
            <Link href="/support">Open Support messages</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 rounded-3xl bg-card p-6 shadow-card ring-1 ring-border/70 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="contact-name">Your name</Label>
          <Input
            id="contact-name"
            autoComplete="name"
            maxLength={80}
            value={name}
            aria-invalid={Boolean(errors.name)}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            aria-invalid={Boolean(errors.email)}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact-topic">Topic</Label>
        <Select value={form.topic} onValueChange={(topic) => setForm({ ...form, topic: topic as ContactTopic })}>
          <SelectTrigger id="contact-topic" className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTACT_TOPICS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          rows={6}
          maxLength={2000}
          value={form.message}
          aria-invalid={Boolean(errors.message)}
          placeholder="How can we help?"
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
        <p className="flex justify-between text-xs text-muted-foreground">
          <span>{errors.message && <span className="text-destructive">{errors.message}</span>}</span>
          <span className="tabular-nums">{form.message.length} / 2000</span>
        </p>
      </div>
      {errors.form && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {errors.form}
        </p>
      )}
      <Button type="submit" size="lg" className="justify-self-start" disabled={sending}>
        {sending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" />}
        Send message
      </Button>
    </form>
  );
}
