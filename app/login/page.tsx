import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to RecipeNest to access your saved recipes, collections and meal plans.",
  robots: { index: false },
};

export default function LoginPage() {
  return <AuthPage mode="login" />;
}
