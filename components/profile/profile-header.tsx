import type { ReactNode } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatDate } from "@/lib/format";
import { ProfileStats, type ProfileStat } from "./profile-stats";

interface ProfileHeaderProps {
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location?: string;
  joinedAt?: string;
  stats: ProfileStat[];
  actions?: ReactNode;
  badge?: ReactNode;
  /** Extra details under the location line, e.g. preference badges. */
  extra?: ReactNode;
  /** Small line above the name, e.g. "Welcome, Abhinav". */
  greeting?: string;
}

export function ProfileHeader({ name, username, avatar, bio, location, joinedAt, stats, actions, badge, extra, greeting }: ProfileHeaderProps) {
  return (
    <header className="border-b bg-surface">
      {/* Cover: brand gradient with a dotted texture and a few drifting shapes */}
      <div aria-hidden className="relative h-36 overflow-hidden bg-gradient-to-r from-ink via-primary to-saffron sm:h-48">
        <div className="absolute inset-0 bg-[radial-gradient(oklch(1_0_0/0.22)_1px,transparent_1.5px)] bg-[length:18px_18px]" />
        <span className="absolute top-6 right-[12%] size-16 rounded-3xl bg-white/15 rotate-12 animate-float-slow" />
        <span className="absolute bottom-4 left-[40%] size-10 rounded-full bg-saffron/40 animate-float" />
        <span className="absolute top-10 left-[18%] size-6 rounded-lg bg-white/20 -rotate-12 animate-bounce-soft" />
      </div>

      <div className="container-page pb-8">
        <div className="-mt-12 flex flex-col gap-6 sm:-mt-14 sm:flex-row sm:items-end">
          <div className="w-fit rounded-full bg-surface p-1.5 shadow-lift animate-pop">
            <UserAvatar name={name} src={avatar} className="size-24 text-2xl sm:size-28" />
          </div>
          <div className="grid flex-1 gap-2 sm:pb-1">
            {greeting && <p className="text-sm font-semibold text-primary">{greeting}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold sm:text-4xl">{name}</h1>
              {badge}
            </div>
            <p className="text-sm text-muted-foreground">@{username}</p>
          </div>
          {actions && <div className="flex flex-wrap gap-2 sm:pb-1">{actions}</div>}
        </div>

        <div className="mt-5 grid gap-2">
          {bio && <p className="max-w-2xl text-pretty text-foreground/85">{bio}</p>}
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" aria-hidden />
                {location}
              </span>
            )}
            {joinedAt && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-primary" aria-hidden />
                Joined {formatDate(joinedAt)}
              </span>
            )}
          </p>
          {extra}
        </div>
        <ProfileStats stats={stats} className="mt-8" />
      </div>
    </header>
  );
}
