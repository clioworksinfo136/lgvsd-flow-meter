import type { FlowMeter, MeterDraft } from "./types";

/** "" / whitespace become null so the field stays empty rather than blank-string. */
export function textOrNull(value: string) {
  return value.trim() || null;
}

/** Non-numeric input becomes null instead of NaN. */
export function numberOrNull(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Form state (all strings) → the shape the API expects. */
export function draftToRecord(draft: MeterDraft) {
  return {
    content: textOrNull(draft.content),
    meterID: textOrNull(draft.meterID),
    latitude: numberOrNull(draft.latitude),
    longitude: numberOrNull(draft.longitude),
    notes: textOrNull(draft.notes),
  };
}

/** A stored meter → editable form state. */
export function meterToDraft(meter: FlowMeter): MeterDraft {
  return {
    content: meter.content ?? "",
    meterID: meter.meterID ?? "",
    latitude: meter.latitude?.toString() ?? "",
    longitude: meter.longitude?.toString() ?? "",
    notes: meter.notes ?? "",
  };
}

/** Fields the user may change; everything else on the record is read-only. */
export const EDITABLE_FIELDS = [
  { key: "meterID", label: "Meter ID", type: "text", required: true },
  { key: "content", label: "Description", type: "text", required: false },
  { key: "latitude", label: "Latitude", type: "number", required: false },
  { key: "longitude", label: "Longitude", type: "number", required: false },
  { key: "notes", label: "Notes", type: "textarea", required: false },
] as const;
