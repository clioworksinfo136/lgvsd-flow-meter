import { useEffect, useMemo, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import type { Layer } from "@deck.gl/core";

type Props = {
  layers: Layer[];
};

/**
 * Mounts a deck.gl GoogleMapsOverlay onto the surrounding <Map>.
 *
 * GoogleMapsOverlay is an OverlayView under the hood, so it shares the Google
 * map's camera; there is no separate viewport to keep in sync.
 */
export function DeckGlOverlay({ layers }: Props) {
  const map = useMap();
  const overlay = useMemo(
    () =>
      new GoogleMapsOverlay({
        interleaved: false,
        // Gravity mains render only a couple of pixels wide; without a picking
        // radius they are near-impossible to click.
        pickingRadius: 6,
      }),
    []
  );

  /** Timer id for a detach that has been scheduled but not yet run. */
  const pendingDetach = useRef<number | null>(null);

  useEffect(() => {
    // Detaching synchronously breaks StrictMode: React mounts, cleans up and
    // remounts within one commit, while GoogleMapsOverlay tears its deck
    // instance down asynchronously — the destroy lands after the re-attach and
    // leaves a blank canvas that never requests a tile. Deferring the detach
    // lets this re-run cancel it first, and setMap(map) is then a no-op because
    // the overlay is still attached to the same map.
    if (pendingDetach.current !== null) {
      clearTimeout(pendingDetach.current);
      pendingDetach.current = null;
    }

    overlay.setMap(map);

    return () => {
      // A real unmount has no re-run to cancel this, so the detach goes ahead
      // and releases the deck instance.
      pendingDetach.current = window.setTimeout(() => {
        pendingDetach.current = null;
        overlay.setMap(null);
      }, 0);
    };
  }, [overlay, map]);

  // Layers are diffed by deck.gl on every change; cheap to call repeatedly.
  useEffect(() => {
    overlay.setProps({ layers });
  }, [overlay, layers]);

  return null;
}
