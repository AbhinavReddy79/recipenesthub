// Prints SQL that reserves every catalog recipe slug in Supabase, so community
// recipes can never take a catalog recipe's link. Run after adding recipes to
// data/recipes and paste the output into the Supabase SQL Editor:
//   npm run db:reserved-slugs
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dirname, "..", "data", "recipes");
const slugs = new Set();
for (const file of readdirSync(dir)) {
  if (!file.endsWith(".ts")) continue;
  for (const match of readFileSync(join(dir, file), "utf8").matchAll(/\bslug:\s*"([a-z0-9-]+)"/g)) slugs.add(match[1]);
}

const values = [...slugs].sort().map((slug) => `  ('${slug}')`).join(",\n");
console.log(`insert into public.reserved_slugs (slug) values\n${values}\non conflict (slug) do nothing;`);
