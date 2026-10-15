import { AttributeList } from "./AttributeList";

export type SelectedFeature = {
  /** What the feature is, e.g. "Gravity pipe" or "Manhole". */
  title: string;
  properties: Record<string, string | number | null>;
};

type Props = {
  feature: SelectedFeature | null;
  onClose: () => void;
};

/** Attribute names are tileset-defined, so every property is listed as-is. */
export function FeatureInfoPanel({ feature, onClose }: Props) {
  if (!feature) return null;
  const { title, properties } = feature;

  const entries = Object.entries(properties)
    .filter(([, value]) => value !== null && value !== "")
    .map(([key, value]) => [key, String(value)] as [string, string]);

  return (
    <div className="feature-panel">
      <header>
        <strong>{title}</strong>
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
