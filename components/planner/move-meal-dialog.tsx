"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mealPlanActions, type SlotRef } from "@/hooks/use-meal-plan";
import { DAYS, MEAL_SLOTS, type DayOfWeek, type MealSlotType, type WeekPlan } from "@/types/mealPlan";

interface MoveMealDialogProps {
  from: SlotRef | null;
  plan: WeekPlan;
  recipeTitle?: string;
  onOpenChange: (open: boolean) => void;
}

export function MoveMealDialog({ from, plan, recipeTitle, onOpenChange }: MoveMealDialogProps) {
  return (
    <Dialog open={from !== null} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 sm:max-w-md">
        {from && <MoveForm key={`${from.day}-${from.slot}`} from={from} plan={plan} recipeTitle={recipeTitle} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function MoveForm({ from, plan, recipeTitle, onClose }: { from: SlotRef; plan: WeekPlan; recipeTitle?: string; onClose: () => void }) {
  const [day, setDay] = useState<DayOfWeek>(from.day);
  const [slot, setSlot] = useState<MealSlotType>(from.slot);
  const same = day === from.day && slot === from.slot;
  const occupied = !same && plan[day][slot];

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold">Move meal</DialogTitle>
        <DialogDescription>
          Move {recipeTitle ?? "this meal"} from {from.day} {from.slot.toLowerCase()}.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3 py-2">
        <div className="grid gap-1.5">
          <Label htmlFor="move-day">Day</Label>
          <Select value={day} onValueChange={(v) => setDay(v as DayOfWeek)}>
            <SelectTrigger id="move-day" className="w-full">
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
          <Label htmlFor="move-slot">Meal</Label>
          <Select value={slot} onValueChange={(v) => setSlot(v as MealSlotType)}>
            <SelectTrigger id="move-slot" className="w-full">
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
      {occupied && (
        <p role="status" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          That slot already has a meal — the two will swap places.
        </p>
      )}
      <DialogFooter className="-mx-6 -mb-6 px-6">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={same}
          onClick={() => {
            mealPlanActions.move(from, { day, slot });
            toast.success(`Moved to ${day} ${slot.toLowerCase()}`);
            onClose();
          }}
        >
          Move meal
        </Button>
      </DialogFooter>
    </>
  );
}
