import { AdminUsersTable } from "@/components/admin/admin-users-table";

export const metadata = { title: "Users" };

export default function AdminUsersPage() {
  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-semibold sm:text-4xl">Users</h1>
        <p className="mt-1 text-muted-foreground">Profiles created on RecipeNest. Suspended users can&apos;t log in.</p>
      </header>
      <AdminUsersTable />
    </div>
  );
}
