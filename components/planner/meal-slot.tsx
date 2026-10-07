"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightLeft, MoreVertical, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mealPlanActions, type SlotRef } from "@/hooks/use-meal-plan";
import { cn } from "@/lib/utils";
import type { MealSlotType, PlannedMeal } from "@/types/mealPlan";
import type { Recipe } from "@/types/recipe";

export const DRAG_MIME = "application/x-recipenest-slot";

/** Each meal of the day has its own accent, used across the planner. */
export const SLOT_TONE: Record<MealSlotType, "amber" | "herb" | "coral" | "berry"> = {
  Breakfast: "amber",
  Lunch: "herb",
  Dinner: "coral",
  Snack: "berry",
};

interface MealSlotProps {
  slotRef: SlotRef;
  meal?: PlannedMeal;
  recipe?: Recipe;
  onAdd: (ref: SlotRef) => void;
  onMove: (ref: SlotRef) => void;
  compact?: boolean;
}

export function MealSlot({ slotRef, meal, recipe, onAdd, onMove, compact = false }: MealSlotProps) {
  const [dragOver, setDragOver] = useState(false);

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      if (e.dataTransfer.types.includes(DRAG_MIME)) {
        e.preventDefault();
        setDragOver(true);
      }
    },
    onDragLeave: () => setDragOver(false),
    onDrop: (e: React.DragEvent) => {
      setDragOver(false);
      const raw = e.dataTransfer.getData(DRAG_MIME);
      if (!raw) return;
      const from = JSON.parse(raw) as SlotRef;
      if (from.day !== slotRef.day || from.slot !== slotRef.slot) mealPlanActions.move(from, slotRef);
    },
  };

  if (!meal || !recipe) {
    return (
      <button
        type="button"
        data-tone={SLOT_TONE[slotRef.slot]}
        onClick={() => onAdd(slotRef)}
        {...dropHandlers}
        aria-label={`Add ${slotRef.slot.toLowerCase()} for ${slotRef.day}`}
        className={cn(
          "group/add flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-tone/20 text-sm font-medium text-muted-foreground transition-all duration-300 hover:border-tone/60 hover:bg-tone-soft hover:text-tone",
          compact ? "h-14" : "h-full min-h-28 flex-col",
          dragOver && "scale-[1.03] border-tone bg-tone-soft text-tone",
        )}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-tone-soft text-tone transition-transform duration-300 group-hover/add:rotate-90 group-hover/add:scale-110">
          <Plus className="size-4" aria-hidden />
        </span>
        <span>Add</span>
      </button>
    );
  }

  const changeServings = (delta: number) =>
    mealPlanActions.setServings(slotRef, Math.max(1, Math.min(24, meal.servings + delta)));

  return (
    <div
      draggable
      data-tone={SLOT_TONE[slotRef.slot]}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_MIME, JSON.stringify(slotRef));
        e.dataTransfer.effectAllowed = "move";
      }}
      {...dropHandlers}
      className={cn(
        "group relative flex overflow-hidden rounded-xl border bg-card shadow-xs transition duration-300 animate-in fade-in zoom-in-95 hover:-translate-y-0.5 hover:shadow-lift",
        compact ? "items-center gap-3 p-2 pl-3" : "h-full min-h-28 flex-col",
        dragOver && "ring-2 ring-tone",
        "cursor-grab active:cursor-grabbing",
      )}
    >
      <span aria-hidden className={cn("absolute z-10 bg-tone", compact ? "inset-y-0 left-0 w-1" : "inset-x-0 top-0 h-1")} />
      <span className={cn("relative shrink-0 overflow-hidden bg-muted", compact ? "size-12 rounded-lg" : "aspect-[16/10] w-full")}>
        <Image src={recipe.image} alt="" fill sizes={compact ? "48px" : "160px"} className="object-cover transition-transform duration-500 group-hover:scale-110" draggable={false} />
      </span>
      <div className={cn("grid min-w-0 flex-1 gap-0.5", !compact && "p-2.5 pr-8")}>
        <Link href={`/recipes/${recipe.slug}`} className="line-clamp-2 text-[0.8125rem] leading-snug font-semibold transition-colors hover:text-tone">
          {recipe.title}
        </Link>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="size-3" aria-hidden />
          {meal.servings} servings
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn("shrink-0", !compact && "absolute right-1 bottom-1.5 size-7")}
            aria-label={`Options for ${recipe.title} on ${slotRef.day}`}
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>
            {slotRef.day} · {slotRef.slot}
          </DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => onAdd(slotRef)}>
            <RefreshCw />
            Replace recipe
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onMove(slotRef)}>
            <ArrowRightLeft />
            Move to…
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); changeServings(1); }}>
            <Plus />
            Add a serving
          </DropdownMenuItem>
          <DropdownMenuItem disabled={meal.servings <= 1} onSelect={(e) => { e.preventDefault(); changeServings(-1); }}>
            <Users />
            Remove a serving
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => mealPlanActions.remove(slotRef)}>
            <Trash2 />
            Clear slot
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
