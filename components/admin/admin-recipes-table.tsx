"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, MoreHorizontal, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DeleteRecipeDialog } from "@/components/recipes/delete-recipe-dialog";
import { ListSkeleton } from "@/components/shared/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHydrated } from "@/hooks/use-hydrated";
import { useUserRecipes } from "@/hooks/use-user-recipes";
import { formatDate } from "@/lib/format";
import { FALLBACK_RECIPE_IMAGE } from "@/lib/images";
import { CUISINE_LABELS, CUISINE_SLUGS } from "@/lib/labels";
import type { AdminRecipeRow } from "@/lib/services/admin";
import type { CuisineSlug, Recipe } from "@/types/recipe";
import { AdminToolbar } from "./admin-toolbar";
import { StatusBadge } from "./status-badge";

interface AdminRecipesTableProps {
  catalog: AdminRecipeRow[];
  initialSource?: string;
}

/** Official catalog (view only here) plus recipes written by users, which can be unpublished or deleted. */
export function AdminRecipesTable({ catalog, initialSource = "all" }: AdminRecipesTableProps) {
  const hydrated = useHydrated();
  const { all, setStatus } = useUserRecipes();
  const [search, setSearch] = useState("");
  const [source, setSource] = useState(initialSource);
  const [status, setStatusFilter] = useState("all");
  const [cuisine, setCuisine] = useState("all");
  const [deleting, setDeleting] = useState<Recipe | null>(null);

  const rows = useMemo<AdminRecipeRow[]>(
    () => [
      ...all.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        image: r.image,
        authorName: r.author.name,
        cuisine: r.cuisine,
        status: r.status,
        submittedAt: r.createdAt,
        source: "user" as const,
      })),
      ...catalog,
    ],
    [all, catalog],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (source === "all" || r.source === source) &&
        (status === "all" || r.status === status) &&
        (cuisine === "all" || r.cuisine === cuisine) &&
        (!q || r.title.toLowerCase().includes(q) || r.authorName.toLowerCase().includes(q)),
    );
  }, [rows, search, source, status, cuisine]);

  if (!hydrated) return <ListSkeleton rows={8} />;

  return (
    <div className="grid gap-5">
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search by title or author"
        resultCount={visible.length}
        noun="recipe"
        filters={[
          {
            label: "Filter by source",
            value: source,
            onChange: setSource,
            options: [
              { value: "all", label: "All sources" },
              { value: "platform", label: "Platform catalog" },
              { value: "user", label: `User recipes (${all.length})` },
            ],
          },
          {
            label: "Filter by status",
            value: status,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All statuses" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Drafts" },
            ],
          },
          {
            label: "Filter by cuisine",
            value: cuisine,
            onChange: setCuisine,
            options: [{ value: "all", label: "All cuisines" }, ...CUISINE_SLUGS.map((c) => ({ value: c, label: CUISINE_LABELS[c] }))],
          },
        ]}
      />
      <div className="overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader className="bg-surface">
            <TableRow>
              <TableHead className="pl-4">Recipe</TableHead>
              <TableHead className="hidden md:table-cell">Cuisine</TableHead>
              <TableHead className="hidden sm:table-cell">Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Added</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  {source === "user" && all.length === 0
                    ? "No user recipes yet. They'll appear here as soon as someone publishes one."
                    : "No recipes match these filters."}
                </TableCell>
              </TableRow>
            )}
            {visible.map((row) => {
              const userRecipe = row.source === "user" ? all.find((r) => r.id === row.id) : undefined;
              return (
                <TableRow key={`${row.source}-${row.id}`}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image src={row.image || FALLBACK_RECIPE_IMAGE} alt="" fill sizes="40px" className="object-cover" />
                      </span>
                      <div className="grid min-w-0">
                        <span className="max-w-56 truncate font-medium">{row.title}</span>
                        <span className="text-xs text-muted-foreground">{row.authorName}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{CUISINE_LABELS[row.cuisine as CuisineSlug] ?? row.cuisine}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={row.source === "user" ? "secondary" : "outline"}>{row.source === "user" ? "User" : "Platform"}</Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(row.submittedAt)}</TableCell>
                  <TableCell className="pr-4">
                    {row.status === "published" || userRecipe ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.title}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {row.status === "published" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/recipes/${row.slug}`}>
                                <Eye />
                                View recipe
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {userRecipe && (
                            <>
                              {userRecipe.status === "published" ? (
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setStatus(userRecipe.id, "draft");
                                    toast.success(`Unpublished “${userRecipe.title}”`);
                                  }}
                                >
                                  <EyeOff />
                                  Unpublish
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setStatus(userRecipe.id, "published");
                                    toast.success(`Published “${userRecipe.title}”`);
                                  }}
                                >
                                  <Send />
                                  Publish
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(userRecipe)}>
                                <Trash2 />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <DeleteRecipeDialog recipe={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </div>
  );
}
