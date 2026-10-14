import { useEffect, useState, type FormEvent } from "react";
import type { FlowMeter, MeterDraft } from "../types";
import { AttributeList } from "./AttributeList";
import { meterAttributeEntries } from "../meterAttributes";
import { EDITABLE_FIELDS, meterToDraft } from "../meterFields";
import { MeterPhotos } from "./MeterPhotos";

type Props = {
  meter: FlowMeter;
  onSave: (id: string, draft: MeterDraft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

type Mode = "view" | "edit" | "confirm-delete";

/**
 * Body of the meter info window: every attribute, with editing for the stored
 * fields and a guarded delete. id/createdAt/updatedAt stay read-only — they are
 * server-managed and rejected by the API if sent back.
 */
export function MeterDetails({ meter, onSave, onDelete }: Props) {
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState<MeterDraft>(() => meterToDraft(meter));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selecting a different meter must not carry over the previous one's edits.
  useEffect(() => {
    setMode("view");
    setDraft(meterToDraft(meter));
    setError(null);
  }, [meter]);

  function update(field: keyof MeterDraft, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!draft.meterID.trim()) {
      setError("Meter ID is required.");
      return;
    }
    setBusy(true);
    try {
      await onSave(meter.id, draft);
      setMode("view");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save changes.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setError(null);
    setBusy(true);
    try {
      await onDelete(meter.id);
      // The info window unmounts with the record; no state reset needed.
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete meter.");
      setBusy(false);
      setMode("view");
    }
  }

  if (mode === "edit") {
    return (
      <form className="meter-details" onSubmit={handleSave}>
        {EDITABLE_FIELDS.map((field) => (
          <label key={field.key}>
            {field.label}
            {field.required && <span aria-hidden="true"> *</span>}
            {field.type === "textarea" ? (
              <textarea
                rows={2}
                value={draft[field.key]}
                onChange={(e) => update(field.key, e.target.value)}
              />
            ) : (
              <input
                type={field.type}
                step={field.type === "number" ? "any" : undefined}
                required={field.required}
                value={draft[field.key]}
                onChange={(e) => update(field.key, e.target.value)}
              />
            )}
          </label>
        ))}

        {error && <p className="error">{error}</p>}

        <div className="detail-actions">
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => {
              setDraft(meterToDraft(meter));
              setError(null);
              setMode("view");
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (mode === "confirm-delete") {
    return (
      <div className="meter-details">
        <p className="confirm">
          Delete <strong>{meter.meterID ?? "this meter"}</strong> permanently?
          This cannot be undone.
        </p>
        {error && <p className="error">{error}</p>}
        <div className="detail-actions">
          <button
            type="button"
            className="danger"
            disabled={busy}
            onClick={handleDelete}
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => setMode("view")}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="meter-details">
      <AttributeList entries={meterAttributeEntries(meter)} />
      <MeterPhotos meterId={meter.id} />
      {error && <p className="error">{error}</p>}
      <div className="detail-actions">
        <button type="button" onClick={() => setMode("edit")}>
          Edit
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => setMode("confirm-delete")}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
