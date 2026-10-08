import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";
import { safeNext } from "@/lib/auth-routes";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Join RecipeNest — save recipes, build collections and plan your meals.",
  robots: { index: false },
};

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { next } = await searchParams;
  return <AuthPage mode="register" next={safeNext(typeof next === "string" ? next : undefined)} />;
}
