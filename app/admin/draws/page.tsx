import { AdminDraws } from "@/components/admin/admin-draws";

export const metadata = { title: "Lucky draws" };

export default function AdminDrawsPage() {
  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-semibold sm:text-4xl">Lucky draws</h1>
        <p className="mt-1 text-muted-foreground">Set up each week&apos;s draw, pick random winners and track cash prize payouts.</p>
      </header>
      <AdminDraws />
    </div>
  );
}
