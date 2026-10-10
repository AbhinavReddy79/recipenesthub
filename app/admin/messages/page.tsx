import { AdminMessages } from "@/components/admin/admin-messages";

export const metadata = { title: "Messages" };

export default function AdminMessagesPage() {
  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-semibold sm:text-4xl">Messages</h1>
        <p className="mt-1 text-muted-foreground">What people sent from the Contact page. Reply by email, then mark them handled.</p>
      </header>
      <AdminMessages />
    </div>
  );
}
