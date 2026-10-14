import type { FlowMeter } from "../types";

type Props = {
  meters: FlowMeter[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
};

export function MeterList({ meters, selectedId, onSelect, onDelete }: Props) {
  if (meters.length === 0) {
    return <p className="empty">No meters yet. Add one to see it on the map.</p>;
  }

  return (
    <ul className="meter-list">
      {meters.map((meter) => {
        const hasLocation = meter.latitude != null && meter.longitude != null;
        return (
          <li
            key={meter.id}
            className={meter.id === selectedId ? "selected" : undefined}
          >
            <button
              type="button"
              className="meter-row"
              onClick={() => onSelect(meter.id)}
              disabled={!hasLocation}
              title={hasLocation ? "Show on map" : "No coordinates recorded"}
            >
              <span className="meter-id">{meter.meterID ?? "Unnamed meter"}</span>
              {meter.content && <span className="meter-desc">{meter.content}</span>}
              <span className="coords">
                {hasLocation
                  ? `${meter.latitude!.toFixed(5)}, ${meter.longitude!.toFixed(5)}`
                  : "No coordinates"}
              </span>
              {meter.notes && <span className="notes">{meter.notes}</span>}
            </button>
            <button
              type="button"
              className="delete"
              aria-label={`Delete ${meter.meterID ?? "meter"}`}
              onClick={() => onDelete(meter.id)}
            >
              ×
            </button>
          </li>
        );
      })}
    </ul>
  );
}
