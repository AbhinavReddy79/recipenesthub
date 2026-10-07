"use client";

import { ExternalLink, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRegion } from "@/hooks/use-region";
import { orderQuery, platformsFor } from "@/lib/order-platforms";

/** "Order" menu for one item: opens a delivery platform's search for it in a new tab. */
export function OrderMenu({ item, compact = false }: { item: string; compact?: boolean }) {
  const { region } = useRegion();
  const query = orderQuery(item);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={compact ? "ghost" : "outline"} size={compact ? "icon-sm" : "xs"} aria-label={`Order ${item}`} className={compact ? "text-muted-foreground" : undefined}>
          <ShoppingCart />
          {!compact && "Order"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="grid gap-0.5">
          <span className="truncate">Order {query}</span>
          <span className="text-xs font-normal text-muted-foreground">Opens the store&apos;s search in {region.name}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {platformsFor(region.code).map((platform) => (
          <DropdownMenuItem key={platform.name} asChild>
            <a href={platform.searchUrl(query)} target="_blank" rel="noopener noreferrer">
              <span className="grid flex-1">
                <span>{platform.name}</span>
                <span className="text-xs text-muted-foreground">{platform.kind}</span>
              </span>
              <ExternalLink className="text-muted-foreground" aria-hidden />
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
