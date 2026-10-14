type Props = {
  entries: Array<[string, string]>;
  emptyMessage?: string;
};

/** Shared key/value rendering for the meter and gravity pipe inspectors. */
export function AttributeList({
  entries,
  emptyMessage = "No attributes to show.",
}: Props) {
  if (entries.length === 0) return <p className="empty">{emptyMessage}</p>;

  return (
    <dl className="attr-list">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
