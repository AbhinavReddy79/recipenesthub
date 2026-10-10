import type { SubscriptionStatus } from "@/lib/supabase/database.types";
import type { RecipeNestClient } from "@/lib/supabase/client";
import { createMemoryStore, useStore } from "./core";
import { userContext } from "./remote";

export interface PlanState {
  /** False until the signed-in member's plan has loaded. */
  loaded: boolean;
  premium: boolean;
  premiumUntil: string | null;
  period: "monthly" | "yearly" | null;
  status: SubscriptionStatus;
  /** Paid through Razorpay (so it can be cancelled in the app), rather than given by an admin. */
  hasRazorpay: boolean;
  recipesThisMonth: number;
  /** Recipes a member may publish this month; null means unlimited. */
  monthlyLimit: number | null;
}

const FREE: PlanState = {
  loaded: false,
  premium: false,
  premiumUntil: null,
  period: null,
  status: "none",
  hasRazorpay: false,
  recipesThisMonth: 0,
  monthlyLimit: 5,
};

/** The signed-in member's plan (Free or Premium) and this month's recipe count. Loaded by sync.ts. */
export const planStore = createMemoryStore<PlanState>(FREE);

export async function loadPlan(supabase: RecipeNestClient): Promise<void> {
  const { data, error } = await supabase.rpc("my_plan").maybeSingle();
  if (error) throw error;
  planStore.set({
    loaded: true,
    premium: data?.premium ?? false,
    premiumUntil: data?.premium_until ?? null,
    period: data?.period ?? null,
    status: data?.status ?? "none",
    hasRazorpay: data?.has_razorpay ?? false,
    recipesThisMonth: data?.recipes_this_month ?? 0,
    monthlyLimit: data?.premium ? null : (data?.monthly_limit ?? 5),
  });
}

/** Re-reads the plan, e.g. after paying or publishing a recipe. */
export async function refreshPlan(): Promise<void> {
  const ctx = userContext();
  if (ctx) await loadPlan(ctx.supabase);
}

export function usePlan(): PlanState {
  return useStore(planStore);
}

/* ---------- Admin ---------- */

export interface MemberPlan {
  premium: boolean;
  premiumUntil: string | null;
  status: SubscriptionStatus;
}

/** Every member's plan, keyed by user id (members without a row are on Free). */
export async function adminListPlans(): Promise<Record<string, MemberPlan>> {
  const ctx = userContext();
  if (!ctx) return {};
  const { data, error } = await ctx.supabase.rpc("admin_list_plans");
  if (error) throw error;
  return Object.fromEntries(
    (data ?? []).map((row) => [row.user_id, { premium: row.premium, premiumUntil: row.premium_until, status: row.status }]),
  );
}

/** Gives a member `days` of Premium (added to any time left), or removes it with 0. */
export async function adminSetPremium(userId: string, days: number): Promise<boolean> {
  const ctx = userContext();
  if (!ctx) return false;
  const { error } = await ctx.supabase.rpc("admin_set_premium", { target: userId, days });
  if (error) {
    console.error(error);
    return false;
  }
  if (userId === ctx.userId) await refreshPlan().catch(() => {});
  return true;
}
