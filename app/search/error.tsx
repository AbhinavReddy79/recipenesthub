"use client";

import { RouteError } from "@/components/shared/route-error";

export default function SearchError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <RouteError
      error={error}
      retry={retry}
      title="Search hit a snag"
      description="Something went wrong while searching recipes. Please try again in a moment."
    />
  );
}
