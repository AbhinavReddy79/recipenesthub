import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to RecipeNest to access your saved recipes, collections and meal plans.",
  robots: { index: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, confirmed } = await searchParams;
  // Both are set by /auth/callback after someone opens a link from our emails.
  return (
    <AuthPage
      mode="login"
      error={typeof error === "string" ? error.slice(0, 200) : undefined}
      notice={confirmed === "1" ? "Your email is confirmed. Log in with your password to get started." : undefined}
    />
  );
}
