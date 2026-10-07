"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { ServingsStepper } from "@/components/recipes/detail/servings-stepper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mealPlanActions, useMealPlan } from "@/hooks/use-meal-plan";
import { useRequireUser } from "@/hooks/use-require-user";
import { DAYS, MEAL_SLOTS, type DayOfWeek, type MealSlotType } from "@/types/mealPlan";
import type { Recipe } from "@/types/recipe";

function defaultSlot(recipe: Recipe): MealSlotType {
  if (recipe.mealType === "Breakfast" || recipe.mealType === "Lunch" || recipe.mealType === "Dinner") return recipe.mealType;
  return "Snack";
}

export function AddToPlanDialog({ recipe, servings }: { recipe: Recipe; servings: number }) {
  const { plan } = useMealPlan();
  const router = useRouter();
  const requireUser = useRequireUser();
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState<DayOfWeek>("Monday");
  const [slot, setSlot] = useState<MealSlotType>(defaultSlot(recipe));
  const [count, setCount] = useState(servings);
  const occupied = plan[day][slot];

  const onOpenChange = (next: boolean) => {
    if (next && !requireUser("Create a free profile to plan your meals for the week.")) return;
    if (next) setCount(servings);
    setOpen(next);
  };

  const save = () => {
    mealPlanActions.assign({ day, slot }, recipe.slug, count);
    setOpen(false);
    toast.success(`Added to ${day} ${slot.toLowerCase()}`, {
      action: { label: "View plan", onClick: () => router.push("/meal-planner") },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarPlus />
          Add to plan
        </Button>
      </DialogTrigger>
      <DialogContent className="p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add to meal plan</DialogTitle>
          <DialogDescription>Schedule {recipe.title} for this week.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="plan-day">Day</Label>
              <Select value={day} onValueChange={(v) => setDay(v as DayOfWeek)}>
                <SelectTrigger id="plan-day" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="plan-slot">Meal</Label>
              <Select value={slot} onValueChange={(v) => setSlot(v as MealSlotType)}>
                <SelectTrigger id="plan-slot" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_SLOTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label>Servings</Label>
            <ServingsStepper value={count} onChange={(v) => setCount(Math.max(1, Math.min(48, v)))} />
          </div>
          {occupied && (
            <p role="status" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
              This replaces what&apos;s currently planned for {day} {slot.toLowerCase()}.
            </p>
          )}
        </div>
        <DialogFooter className="-mx-6 -mb-6 px-6">
          <Button variant="ghost" asChild>
            <Link href="/meal-planner">Open planner</Link>
          </Button>
          <Button onClick={save}>Add to {day}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
