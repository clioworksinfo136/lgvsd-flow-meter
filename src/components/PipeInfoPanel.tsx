import { AttributeList } from "./AttributeList";

type Props = {
  properties: Record<string, string | number | null> | null;
  onClose: () => void;
};

/** Attribute names are tileset-defined, so every property is listed as-is. */
export function PipeInfoPanel({ properties, onClose }: Props) {
  if (!properties) return null;

  const entries = Object.entries(properties)
    .filter(([, value]) => value !== null && value !== "")
    .map(([key, value]) => [key, String(value)] as [string, string]);

  return (
    <div className="pipe-panel">
      <header>
        <strong>Gravity pipe</strong>
        <button type="button" className="delete" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>
      <AttributeList
        entries={entries}
        emptyMessage="No attributes on this feature."
      />
    </div>
  );
}
