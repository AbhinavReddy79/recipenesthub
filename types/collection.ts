export interface Collection {
  id: string;
  name: string;
  description: string;
  /** Recipe slugs in display order. */
  recipeSlugs: string[];
  /** Optional explicit cover; falls back to the first recipe's image. */
  cover?: string;
  createdAt: string;
  updatedAt: string;
}
