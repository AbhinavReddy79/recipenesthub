import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Join RecipeNest — save recipes, build collections and plan your meals.",
  robots: { index: false },
};

export default function RegisterPage() {
  return <AuthPage mode="register" />;
}
