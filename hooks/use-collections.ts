import { useMemo } from "react";
import { collectionsStorage, collectionsStore } from "@/lib/storage/collections";
import { useStore } from "@/lib/storage/core";

export const collectionActions = collectionsStorage;

export function useCollections() {
  const collections = useStore(collectionsStore);
  return { collections, ...collectionsStorage };
}

export function useCollection(id: string) {
  const collections = useStore(collectionsStore);
  return useMemo(() => collections.find((c) => c.id === id) ?? null, [collections, id]);
}
