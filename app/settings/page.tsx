import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { SettingsView } from "@/components/profile/settings-view";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

export default function SettingsPage() {
  return (
    <ModuleTone tone="ocean">
      <PageHeader
        icon={<Settings />}
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, preferences, appearance and notifications."
      />
      <div className="container-page py-10 pb-24">
        <SettingsView />
      </div>
    </ModuleTone>
  );
}
