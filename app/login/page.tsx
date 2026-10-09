import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";
import { authLinkError, safeNext } from "@/lib/auth-routes";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to RecipeNest to access your saved recipes, collections and meal plans.",
  robots: { index: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, confirmed, next } = await searchParams;
  // Set by /auth/callback after someone opens a link from our emails. Only known
  // codes map to a message, so nobody can put their own text on this page.
  return (
    <AuthPage
      mode="login"
      error={authLinkError(error)}
      notice={confirmed === "1" ? "Your email is confirmed. Log in with your password to get started." : undefined}
      next={safeNext(typeof next === "string" ? next : undefined)}
    />
  );
}
