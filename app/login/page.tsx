import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to RecipeNest to access your saved recipes, collections and meal plans.",
  robots: { index: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  // Set by /auth/callback when an email link is invalid or expired.
  return <AuthPage mode="login" error={typeof error === "string" ? error.slice(0, 200) : undefined} />;
}
