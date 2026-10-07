"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

/** Crops the uploaded photo to a 256px square so it fits comfortably in localStorage. */
async function toAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const size = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  canvas
    .getContext("2d")
    ?.drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size, 0, 0, 256, 256);
  return canvas.toDataURL("image/jpeg", 0.85);
}

interface AvatarFieldProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  id: string;
}

/** Optional profile photo: upload, replace or remove (initials are shown otherwise). */
export function AvatarField({ name, value, onChange, id }: AvatarFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file (JPG or PNG).");
    if (file.size > 8 * 1024 * 1024) return setError("Images must be under 8 MB.");
    try {
      onChange(await toAvatarDataUrl(file));
      setError(undefined);
    } catch {
      setError("We couldn't read that image. Try a JPG or PNG.");
    }
  };

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium" id={`${id}-label`}>
        Profile photo <span className="font-normal text-muted-foreground">(optional)</span>
      </span>
      <div className="flex items-center gap-4">
        <UserAvatar name={name || "You"} src={value} className="size-14 text-base" />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} aria-describedby={`${id}-label`}>
            <Camera />
            {value ? "Change photo" : "Upload photo"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              <Trash2 />
              Remove
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {error && (
        <p role="alert" className="text-[0.8125rem] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
