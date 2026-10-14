import { useEffect, useState, type FormEvent } from "react";
import { emptyDraft, type MeterDraft } from "../types";

type Props = {
  /** Coordinates pushed in from a map click; null when nothing is picked. */
  pickedLocation: { lat: number; lng: number } | null;
  onSubmit: (draft: MeterDraft) => Promise<void>;
};

export function FlowMeterForm({ pickedLocation, onSubmit }: Props) {
  const [draft, setDraft] = useState<MeterDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A map click overwrites whatever is in the coordinate fields.
  useEffect(() => {
    if (!pickedLocation) return;
    setDraft((prev) => ({
      ...prev,
      latitude: pickedLocation.lat.toFixed(6),
      longitude: pickedLocation.lng.toFixed(6),
    }));
  }, [pickedLocation]);

  function update(field: keyof MeterDraft, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    // Without an ID a meter shows up everywhere as "Unnamed meter", so it is
    // the one field that cannot be blank.
    if (!draft.meterID.trim()) {
      setError("Meter ID is required.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(draft);
      setDraft(emptyDraft);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save meter.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="meter-form" onSubmit={handleSubmit}>
      <label>
        Meter ID <span aria-hidden="true">*</span>
        <input
          required
          value={draft.meterID}
          onChange={(e) => update("meterID", e.target.value)}
          placeholder="FM-001"
        />
      </label>

      <label>
        Description
        <input
          value={draft.content}
          onChange={(e) => update("content", e.target.value)}
          placeholder="Influent channel"
        />
      </label>

      <div className="coord-row">
        <label>
          Latitude
          <input
            type="number"
            step="any"
            min="-90"
            max="90"
            value={draft.latitude}
            onChange={(e) => update("latitude", e.target.value)}
            placeholder="37.998300"
          />
        </label>
        <label>
          Longitude
          <input
            type="number"
            step="any"
            min="-180"
            max="180"
            value={draft.longitude}
            onChange={(e) => update("longitude", e.target.value)}
            placeholder="-122.520500"
          />
        </label>
      </div>

      <p className="hint">Click the map to drop coordinates into these fields.</p>

      <label>
        Notes
        <textarea
          rows={3}
          value={draft.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Access via north gate; calibrated 2026-03."
        />
      </label>

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Add meter"}
      </button>
    </form>
  );
}
