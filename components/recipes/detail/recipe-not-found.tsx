import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export function RecipeNotFound() {
  return (
    <div className="container-page py-16">
      <EmptyState
        headingLevel="h1"
        icon={SearchX}
        title="Recipe not found"
        description="This recipe may have been removed, renamed, or never existed. Let's find you something else delicious."
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/recipes">Explore recipes</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/search">Search</Link>
            </Button>
          </>
        }
      />
    </div>
  );
}
