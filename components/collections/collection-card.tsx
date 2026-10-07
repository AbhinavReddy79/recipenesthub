"use client";

import Link from "next/link";
import { BookOpen, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, pluralize } from "@/lib/format";
import type { Collection } from "@/types/collection";
import { CollectionCover } from "./collection-cover";

interface CollectionCardProps {
  collection: Collection;
  images: string[];
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CollectionCard({ collection, images, onEdit, onDelete }: CollectionCardProps) {
  const count = collection.recipeSlugs.length;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lift">
      <div className="relative">
        <CollectionCover images={images} className="aspect-[16/10]" />
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
          <BookOpen className="size-3.5" aria-hidden />
          {pluralize(count, "recipe")}
        </span>
      </div>
      <div className="flex items-start gap-3 p-5">
        <div className="grid min-w-0 flex-1 gap-1">
          <h3 className="font-display text-xl font-semibold transition-colors group-hover:text-tone">
            <Link
              href={`/collections/${collection.id}`}
              className="outline-none after:absolute after:inset-0 focus-visible:after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
            >
              {collection.name}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground">Updated {formatDate(collection.updatedAt)}</p>
          {collection.description && (
            <p className="mt-1 line-clamp-2 text-sm text-foreground/80">{collection.description}</p>
          )}
        </div>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="relative z-10 -mr-1" aria-label={`Options for ${collection.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil />
                Edit collection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </article>
  );
}
