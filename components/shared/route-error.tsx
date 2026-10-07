"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./empty-state";

interface RouteErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
  title?: string;
  description?: string;
}

/** Friendly fallback rendered by route-level error boundaries. */
export function RouteError({
  error,
  retry,
  title = "Something went wrong",
  description = "An unexpected error occurred. Your saved recipes and plans are safe on this device.",
}: RouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page py-16">
      <EmptyState
        icon={CircleAlert}
        title={title}
        description={description}
        actions={
          <>
            <Button size="lg" onClick={retry}>
              <RotateCcw data-icon="inline-start" />
              Try again
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/">Go home</Link>
            </Button>
          </>
        }
      />
    </div>
  );
}
