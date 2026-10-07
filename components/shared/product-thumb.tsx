import Image from "next/image";
import { Beef, Carrot, Flame, Milk, Package, Wheat, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IngredientAisle } from "@/types/recipe";
import type { Tone } from "./module-tone";

const AISLE_FALLBACK: Record<IngredientAisle, { icon: LucideIcon; tone: Tone }> = {
  Produce: { icon: Carrot, tone: "herb" },
  Dairy: { icon: Milk, tone: "ocean" },
  Meat: { icon: Beef, tone: "red" },
  Grains: { icon: Wheat, tone: "amber" },
  Spices: { icon: Flame, tone: "berry" },
  Other: { icon: Package, tone: "coral" },
};

interface ProductThumbProps {
  name: string;
  image?: string;
  aisle: IngredientAisle;
  className?: string;
}

/** Product photo on a white tile; products without a photo show their aisle's icon instead. */
export function ProductThumb({ name, image, aisle, className }: ProductThumbProps) {
  const { icon: Icon, tone } = AISLE_FALLBACK[aisle];
  return (
    <span
      data-tone={tone}
      className={cn(
        "relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-soft ring-1 ring-border/70",
        !image && "bg-tone-soft",
        className,
      )}
    >
      {image ? (
        <Image src={image} alt={name} fill sizes="56px" className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-110" />
      ) : (
        <Icon className="size-6 text-tone" aria-hidden />
      )}
    </span>
  );
}
