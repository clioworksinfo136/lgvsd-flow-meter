import type { FlowMeter } from "./types";

/** Shown first and in this order; anything else follows alphabetically. */
const PREFERRED_ORDER = [
  "meterID",
  "content",
  "latitude",
  "longitude",
  "notes",
  "id",
  "createdAt",
  "updatedAt",
];

const TIMESTAMP_KEYS = new Set(["createdAt", "updatedAt"]);

function formatValue(key: string, value: unknown): string {
  if (value == null || value === "") return "—";
  if (TIMESTAMP_KEYS.has(key) && typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString();
  }
  return String(value);
}

/**
 * Every stored attribute of a meter, as display-ready pairs.
 *
 * Amplify model instances carry lazy-loader functions for related records
 * alongside the plain fields, so only primitives are listed. Empty fields are
 * kept and rendered as an em dash rather than hidden, so the record's full
 * shape is visible.
 */
export function meterAttributeEntries(meter: FlowMeter): Array<[string, string]> {
  const own = Object.entries(meter).filter(
    ([, value]) =>
      typeof value !== "function" &&
      // typeof null === "object", so null must be allowed through explicitly
      // or every empty field disappears instead of rendering as an em dash.
      (value === null || typeof value !== "object")
  );
  const byKey = new Map(own);

  const ordered: Array<[string, string]> = [];
  for (const key of PREFERRED_ORDER) {
    if (byKey.has(key)) {
      ordered.push([key, formatValue(key, byKey.get(key))]);
      byKey.delete(key);
    }
  }
  for (const key of [...byKey.keys()].sort()) {
    ordered.push([key, formatValue(key, byKey.get(key))]);
  }
  return ordered;
}
