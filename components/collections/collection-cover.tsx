import Image from "next/image";
import { FolderHeart } from "lucide-react";
import { cn } from "@/lib/utils";

/** A three-image mosaic built from the collection's recipes. */
export function CollectionCover({ images, className, sizes = "(min-width: 1024px) 30vw, 90vw" }: { images: string[]; className?: string; sizes?: string }) {
  const [first, second, third] = images;
  if (!first) {
    return (
      <div className={cn("relative flex items-center justify-center overflow-hidden bg-tone-soft text-tone", className)}>
        <div aria-hidden className="absolute inset-0 bg-dots opacity-80" />
        <FolderHeart className="relative size-12 animate-float" strokeWidth={1.5} aria-hidden />
      </div>
    );
  }
  return (
    <div className={cn("grid grid-cols-[2fr_1fr] grid-rows-2 gap-0.5 overflow-hidden bg-border", className)}>
      <div className={cn("relative overflow-hidden bg-muted", second ? "row-span-2" : "col-span-2 row-span-2")}>
        <Image src={first} alt="" fill sizes={sizes} className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
      </div>
      {second && (
        <div className={cn("relative overflow-hidden bg-muted", !third && "row-span-2")}>
          <Image src={second} alt="" fill sizes="15vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
        </div>
      )}
      {third && (
        <div className="relative overflow-hidden bg-muted">
          <Image src={third} alt="" fill sizes="15vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
        </div>
      )}
    </div>
  );
}
