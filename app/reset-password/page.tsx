import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="relative isolate flex flex-1 items-center justify-center overflow-hidden bg-warm-glow px-4 py-12 sm:px-6">
      <div aria-hidden className="absolute inset-0 -z-10 bg-dots opacity-60 [mask-image:radial-gradient(closest-side,black,transparent)]" />
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-lift ring-1 ring-border/70 animate-rise sm:p-8">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
