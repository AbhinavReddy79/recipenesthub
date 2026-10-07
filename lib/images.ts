/**
 * Builds an Unsplash CDN URL for a photo id. The source is requested at a
 * generous width; next/image handles responsive resizing and formats.
 */
export function unsplash(photoId: string, width = 1400): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=80`;
}

/** Shown when a user-created recipe has no image yet. */
export const FALLBACK_RECIPE_IMAGE = unsplash("1495521821757-a1efb6729352");
