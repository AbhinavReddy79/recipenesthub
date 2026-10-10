import { AdminContests } from "@/components/admin/admin-contests";

export const metadata = { title: "Contests" };

export default function AdminContestsPage() {
  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-semibold sm:text-4xl">Weekly contests</h1>
        <p className="mt-1 text-muted-foreground">Set each week&apos;s theme and prize, announce winners and track prize payouts.</p>
      </header>
      <AdminContests />
    </div>
  );
}
