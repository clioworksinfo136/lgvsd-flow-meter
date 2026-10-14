import { useEffect, useState, type FormEvent } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

const emptyForm = {
  content: "",
  meterID: "",
  latitude: "",
  longitude: "",
  notes: "",
};

function App() {
  const [meters, setMeters] = useState<Array<Schema["FlowMeter"]["type"]>>([]);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    client.models.FlowMeter.observeQuery().subscribe({
      next: (data) => setMeters([...data.items]),
    });
  }, []);

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toNumber(value: string) {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  async function createMeter(event: FormEvent) {
    event.preventDefault();
    await client.models.FlowMeter.create({
      content: form.content.trim() || null,
      meterID: form.meterID.trim() || null,
      latitude: toNumber(form.latitude),
      longitude: toNumber(form.longitude),
      notes: form.notes.trim() || null,
    });
    setForm(emptyForm);
  }

  return (
    <main>
      <h1>Flow meters</h1>

      <form onSubmit={createMeter} className="meter-form">
        <input
          placeholder="Content"
          value={form.content}
          onChange={(e) => updateField("content", e.target.value)}
        />
        <input
          placeholder="Meter ID"
          value={form.meterID}
          onChange={(e) => updateField("meterID", e.target.value)}
        />
        <input
          type="number"
          step="any"
          min="-90"
          max="90"
          placeholder="Latitude"
          value={form.latitude}
          onChange={(e) => updateField("latitude", e.target.value)}
        />
        <input
          type="number"
          step="any"
          min="-180"
          max="180"
          placeholder="Longitude"
          value={form.longitude}
          onChange={(e) => updateField("longitude", e.target.value)}
        />
        <textarea
          placeholder="Notes"
          rows={3}
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
        />
        <button type="submit">+ new</button>
      </form>

      <ul className="meter-list">
        {meters.map((meter) => (
          <li key={meter.id}>
            <strong>{meter.meterID ?? "(no meter ID)"}</strong>
            {meter.content ? ` — ${meter.content}` : ""}
            {meter.latitude != null && meter.longitude != null && (
              <div className="coords">
                {meter.latitude}, {meter.longitude}
              </div>
            )}
            {meter.notes && <div className="notes">{meter.notes}</div>}
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;
