import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { LaunchCard } from "@/components/admin/launch-card";
import { MessagesCard } from "@/components/admin/messages-card";
import { WaitlistCard } from "@/components/admin/waitlist-card";
import { getCatalogStats } from "@/lib/services/admin";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getCatalogStats();
  return (
    <div className="grid gap-10">
      <header>
        <h1 className="text-3xl font-semibold sm:text-4xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Live numbers for RecipeNest — calculated from real data, never estimated.</p>
      </header>
      <LaunchCard />
      <WaitlistCard />
      <MessagesCard />
      <AdminDashboard platformRecipes={stats.platformRecipes} />
    </div>
  );
}
