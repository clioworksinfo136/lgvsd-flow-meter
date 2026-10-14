import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type Photo = { path: string; url: string };

type Props = {
  photos: Photo[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onDelete: (path: string) => Promise<void>;
};

/**
 * Full-size photo viewer with carousel navigation.
 *
 * Rendered through a portal to document.body: the info window that hosts the
 * thumbnails sets overflow-y and a max-height, so an overlay nested inside it
 * would be clipped to that box instead of covering the screen.
 */
export function PhotoLightbox({
  photos,
  index,
  onIndexChange,
  onClose,
  onDelete,
}: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photo = photos[index];
  const count = photos.length;

  const step = useCallback(
    (delta: number) => {
      if (count < 2) return;
      // Wrap in both directions so the carousel is endless.
      onIndexChange((index + delta + count) % count);
      setConfirmingDelete(false);
      setError(null);
    },
    [count, index, onIndexChange]
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, step]);

  // The page behind must not scroll while the overlay is up.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (!photo) return null;

  async function handleDelete() {
    setError(null);
    setBusy(true);
    try {
      await onDelete(photo.path);
      // The parent reloads the list; close if that emptied it, otherwise land
      // on the photo that shifted into this slot (or the new last one).
      if (count <= 1) onClose();
      else onIndexChange(Math.min(index, count - 2));
      setConfirmingDelete(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete photo.");
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Meter photo viewer"
      onClick={onClose}
    >
      {/* Clicks inside the frame must not fall through to the backdrop. */}
      <div className="lightbox-frame" onClick={(e) => e.stopPropagation()}>
        <header>
          <span>
            {index + 1} of {count}
          </span>
          <button type="button" onClick={onClose} aria-label="Close viewer">
            ×
          </button>
        </header>

        <div className="lightbox-stage">
          {count > 1 && (
            <button
              type="button"
              className="nav prev"
              onClick={() => step(-1)}
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}

          <img src={photo.url} alt={`Meter photo ${index + 1} of ${count}`} />

          {count > 1 && (
            <button
              type="button"
              className="nav next"
              onClick={() => step(1)}
              aria-label="Next photo"
            >
              ›
            </button>
          )}
        </div>

        <footer>
          {error && <p className="error">{error}</p>}
          {confirmingDelete ? (
            <>
              <span className="confirm">Delete this photo permanently?</span>
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
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="danger"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete photo
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
}
