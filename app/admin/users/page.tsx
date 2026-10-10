import { AddUserDialog } from "@/components/admin/add-user-dialog";
import { AdminUsersTable } from "@/components/admin/admin-users-table";

export const metadata = { title: "Users" };

export default function AdminUsersPage() {
  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Users</h1>
          <p className="mt-1 text-muted-foreground">Profiles created on RecipeNest. Suspended users can&apos;t log in.</p>
        </div>
        <AddUserDialog />
      </header>
      <AdminUsersTable />
    </div>
  );
}
