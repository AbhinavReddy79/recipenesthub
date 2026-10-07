"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Check, ImagePlus, Link2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { unsplash } from "@/lib/images";
import { cn } from "@/lib/utils";

const GALLERY = [
  "1546069901-ba9599a7e63c",
  "1540189549336-e6e99c3679fe",
  "1565299624946-b28f40a0ae38",
  "1567620905732-2d1ec7ab7445",
  "1563245372-f21724e3856d",
  "1598515214211-89d3c73ae83b",
  "1600335895229-6e75511892c8",
  "1505576399279-565b52d4ac71",
].map((id) => unsplash(id, 1200));

const MAX_BYTES = 8 * 1024 * 1024;

/** Downscales an uploaded photo so it fits comfortably in localStorage. */
async function compress(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

interface ImagePickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id: string;
}

export function ImagePicker({ value, onChange, error, id }: ImagePickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [localError, setLocalError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setLocalError("That file isn't an image.");
    if (file.size > MAX_BYTES) return setLocalError("Images must be under 8 MB.");
    setBusy(true);
    try {
      onChange(await compress(file));
      setLocalError(undefined);
    } catch {
      setLocalError("We couldn't read that image. Try a JPG or PNG.");
    } finally {
      setBusy(false);
    }
  };

  const applyUrl = () => {
    try {
      const parsed = new URL(url.trim());
      if (parsed.hostname !== "images.unsplash.com") {
        setLocalError("For now, image links must come from images.unsplash.com — or upload a photo.");
        return;
      }
      onChange(parsed.toString());
      setLocalError(undefined);
    } catch {
      setLocalError("That doesn't look like a valid URL.");
    }
  };

  const message = localError ?? error;

  return (
    <div className="grid gap-3">
      {value ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl border bg-muted">
          <Image src={value} alt="Recipe photo preview" fill sizes="(min-width: 768px) 640px, 100vw" className="object-cover" />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute top-3 right-3 bg-background/90 text-foreground hover:bg-background"
            onClick={() => onChange("")}
          >
            <Trash2 />
            Remove
          </Button>
        </div>
      ) : (
        <button
          id={id}
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void onFile(e.dataTransfer.files[0]);
          }}
          aria-describedby={message ? `${id}-error` : undefined}
          className={cn(
            "flex aspect-[16/9] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent",
            message && "border-destructive/60",
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-terracotta-soft text-primary">
            <ImagePlus className="size-5" aria-hidden />
          </span>
          <span className="text-sm">
            <span className="font-semibold text-foreground">{busy ? "Processing…" : "Upload a photo"}</span> or drag it here
          </span>
          <span className="text-xs">JPG or PNG, up to 8 MB</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {message && (
        <p id={`${id}-error`} role="alert" className="text-[0.8125rem] text-destructive">
          {message}
        </p>
      )}

      <Tabs defaultValue="gallery" className="gap-3">
        <TabsList>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="url">Image link</TabsTrigger>
        </TabsList>
        <TabsContent value="gallery">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8" role="group" aria-label="Choose a sample photo">
            {GALLERY.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => {
                  onChange(src);
                  setLocalError(undefined);
                }}
                aria-pressed={value === src}
                aria-label={`Sample photo ${i + 1}`}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-lg ring-offset-2 ring-offset-background transition",
                  value === src ? "ring-2 ring-primary" : "hover:opacity-85",
                )}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                {value === src && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                    <Check className="size-5" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="upload">
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Upload />
            Choose a file
          </Button>
        </TabsContent>
        <TabsContent value="url">
          <div className="flex gap-2">
            <Input
              aria-label="Image URL"
              placeholder="https://images.unsplash.com/photo-…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button type="button" variant="outline" className="h-10" onClick={applyUrl}>
              <Link2 />
              Use
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
