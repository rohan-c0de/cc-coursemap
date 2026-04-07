import fs from "fs";
import path from "path";
import type { Institution } from "./types";

const cache: Record<string, Institution[]> = {};

/**
 * Load institutions for a given state from data/{state}/institutions.json.
 * Results are cached in memory after first load.
 */
export function loadInstitutions(state = "va"): Institution[] {
  if (cache[state]) return cache[state];

  const filePath = path.join(process.cwd(), "data", state, "institutions.json");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    cache[state] = JSON.parse(raw) as Institution[];
  } catch (err) {
    console.error(`Failed to load institutions for ${state}:`, err);
    cache[state] = [];
  }
  return cache[state];
}
