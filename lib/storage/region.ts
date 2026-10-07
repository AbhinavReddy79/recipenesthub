import { isRegionCode, type RegionCode } from "@/lib/regions";
import { createPersistentStore } from "./core";

/** The pricing region chosen on this browser; `null` means detect it automatically. */
export const regionStore = createPersistentStore<RegionCode | null>("region", null, (v) => (isRegionCode(v) ? v : null));

export const regionStorage = {
  setRegion: (code: RegionCode | null) => regionStore.set(code),
};
