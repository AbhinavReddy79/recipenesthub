"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { OrderMenu } from "@/components/shared/order-menu";
import { ProductThumb } from "@/components/shared/product-thumb";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { shoppingActions } from "@/hooks/use-shopping-list";
import { formatIngredientName, formatQuantity, formatUnit } from "@/lib/format";
import { useRegion } from "@/hooks/use-region";
import { getProduct } from "@/lib/products";
import { cn } from "@/lib/utils";
import type { ShoppingItem as Item } from "@/types/mealPlan";
import { ItemFields, useItemForm } from "./item-fields";

export function ShoppingItem({ item }: { item: Item }) {
  const [editing, setEditing] = useState(false);
  const { price, format, packSize } = useRegion();
  const id = `item-${item.id}`;
  const amount = item.product
    ? `${item.quantity ?? 1} ×`
    : item.quantity !== null
      ? `${formatQuantity(item.quantity)}${item.unit ? ` ${formatUnit(item.unit, item.quantity)}` : ""}`
      : "";

  return (
    <li className={cn("group flex items-center gap-3 px-4 py-3 transition-colors animate-in fade-in slide-in-from-left-2 duration-300 hover:bg-tone-soft/60", item.checked && "bg-muted/40")}>
      <Checkbox
        id={id}
        checked={item.checked}
        onCheckedChange={() => shoppingActions.toggle(item.id)}
        className="size-5 rounded-full data-checked:border-tone data-checked:bg-tone data-checked:text-tone-foreground"
      />
      {item.product && (
        <ProductThumb
          name={item.name}
          image={getProduct(item.product.id)?.image}
          aisle={item.aisle}
          className={cn("size-11", item.checked && "opacity-50 grayscale")}
        />
      )}
      <label htmlFor={id} className="grid min-w-0 flex-1 cursor-pointer">
        <span className={cn("text-[0.9375rem] transition-colors", item.checked && "text-muted-foreground line-through")}>
          {amount && <strong className="font-semibold tabular-nums">{amount} </strong>}
          {item.product ? item.name : formatIngredientName(item.name, item.quantity, item.unit)}
        </span>
        {(item.product || item.sources.length > 0) && (
          <span className="truncate text-xs text-muted-foreground">
            {item.product && (
              <>
                {packSize(item.product.packSize)} · est. {format(price(item.product.price) * (item.quantity ?? 1))}
                {item.sources.length > 0 && " · "}
              </>
            )}
            {item.sources.length > 0 && <>For {item.sources.join(", ")}</>}
          </span>
        )}
      </label>
      {!item.checked && <OrderMenu item={item.name} compact />}
      <div className="flex shrink-0 gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} aria-label={`Edit ${item.name}`}>
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="hover:text-destructive"
          onClick={() => shoppingActions.remove(item.id)}
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 />
        </Button>
      </div>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="p-6 sm:max-w-lg">
          {editing && <EditItemForm item={item} onDone={() => setEditing(false)} />}
        </DialogContent>
      </Dialog>
    </li>
  );
}

function EditItemForm({ item, onDone }: { item: Item; onDone: () => void }) {
  const form = useItemForm(
    {
      name: item.name,
      quantity: item.quantity === null ? "" : String(item.quantity),
      unit: item.unit,
      aisle: item.aisle,
    },
    (input) => {
      shoppingActions.update(item.id, input);
      onDone();
    },
  );
  return (
    <form onSubmit={form.submit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold">Edit item</DialogTitle>
        <DialogDescription>Update the name, amount or category.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-2 sm:flex sm:flex-wrap">
        <ItemFields values={form.values} setValues={form.setValues} idPrefix="edit-item" error={form.error} />
      </div>
      {form.error && (
        <p role="alert" className="text-[0.8125rem] text-destructive">
          {form.error}
        </p>
      )}
      <DialogFooter className="-mx-6 -mb-6 px-6">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Save item</Button>
      </DialogFooter>
    </form>
  );
}
