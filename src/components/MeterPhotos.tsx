import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { getUrl, list, remove, uploadData } from "aws-amplify/storage";
import { PhotoLightbox, type Photo } from "./PhotoLightbox";

type Props = {
  /** The record id, not meterID — meterID is user-editable and would orphan files. */
  meterId: string;
};

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * S3 denials arrive as a full IAM message naming the role, bucket and action —
 * far too long for a popover. Keep the detail in the console and show a short
 * line, since the fix is always the same: deploy the storage access rules.
 */
function friendlyError(cause: unknown, fallback: string) {
  const message = cause instanceof Error ? cause.message : String(cause);
  console.error(cause);
  if (/not authorized|AccessDenied|Forbidden/i.test(message)) {
    return "Not authorized — storage permissions need deploying.";
  }
  return message || fallback;
}

/** Keep object keys predictable and collision-free. */
function storageKey(fileName: string) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${Date.now()}-${safe}`;
}

export function MeterPhotos({ meterId }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const prefix = `flow-meters/${meterId}/`;

  const refresh = useCallback(async () => {
    const { items } = await list({ path: prefix });
    const resolved = await Promise.all(
      items
        // A zero-byte "folder" marker can appear in a prefix; it is not a photo.
        .filter((item) => item.path !== prefix)
        .map(async (item) => ({
          path: item.path,
          url: (await getUrl({ path: item.path })).url.toString(),
        }))
    );
    setPhotos(resolved);
  }, [prefix]);

  useEffect(() => {
    let active = true;
    refresh().catch((cause) => {
      if (active) setError(friendlyError(cause, "Could not load photos."));
    });
    return () => {
      active = false;
    };
  }, [refresh]);

  async function handleDelete(path: string) {
    await remove({ path });
    await refresh();
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear immediately so picking the same file twice still fires onChange.
    event.target.value = "";
    if (!file) return;

    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Images must be 10 MB or smaller.");
      return;
    }

    setBusy(true);
    try {
      await uploadData({
        path: `${prefix}${storageKey(file.name)}`,
        data: file,
        options: { contentType: file.type },
      }).result;
      await refresh();
    } catch (cause) {
      setError(friendlyError(cause, "Upload failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="meter-photos">
      {photos.length > 0 && (
        <ul className="photo-strip">
          {photos.map((photo, position) => (
            <li key={photo.path}>
              <button
                type="button"
                onClick={() => setLightboxIndex(position)}
                aria-label={`Open photo ${position + 1}`}
              >
                <img src={photo.url} alt="Meter photo" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Guard the upper bound too: an index left past the end after a delete
          would mount an invisible overlay that still holds the scroll lock. */}
      {lightboxIndex !== null && lightboxIndex < photos.length && (
        <PhotoLightbox
          photos={photos}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={handleDelete}
        />
      )}

      {error && <p className="error">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFile}
      />
      <button
        type="button"
        className="secondary"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Uploading…" : "Photo"}
      </button>
    </div>
  );
}
