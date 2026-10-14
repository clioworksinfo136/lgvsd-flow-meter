import { useCallback, useEffect, useRef } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

/** How long the cone is drawn, in screen pixels, so it looks stable at any zoom. */
const CONE_PIXELS = 90;

const CONE_FILL = "#7c3aed";
const CONE_STROKE = "#5b21b6";

/**
 * Street View's horizontal field of view narrows as its zoom increases;
 * ~180°/2^zoom matches what the panorama actually shows closely enough for an
 * indicator, and the clamp keeps the wedge readable at the extremes.
 */
function fieldOfView(panoramaZoom: number | undefined) {
  const zoom = panoramaZoom ?? 1;
  return Math.min(120, Math.max(20, 180 / 2 ** zoom));
}

type Props = {
  /** Fires when the panorama opens or closes, so the layout can split. */
  onVisibleChange: (visible: boolean) => void;
};

/**
 * Right-hand Street View panorama, driven by the map's own Pegman.
 *
 * The map's default Street View would take over the map's own container. Giving
 * it a panorama bound to this container instead (map.setStreetView) keeps the
 * map on screen, so dropping Pegman splits the window rather than replacing it.
 *
 * A purple wedge on the map tracks the panorama's position, heading and zoom.
 */
export function StreetViewPane({ onVisibleChange }: Props) {
  const map = useMap("main");
  const streetViewLibrary = useMapsLibrary("streetView");
  const geometryLibrary = useMapsLibrary("geometry");
  const mapsLibrary = useMapsLibrary("maps");

  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const coneRef = useRef<google.maps.Polygon | null>(null);

  const updateCone = useCallback(() => {
    const panorama = panoramaRef.current;
    const cone = coneRef.current;
    if (!map || !panorama || !cone || !geometryLibrary) return;

    const position = panorama.getPosition();
    if (!position || !panorama.getVisible()) {
      cone.setMap(null);
      return;
    }

    const pov = panorama.getPov();
    const zoom = map.getZoom() ?? 16;
    // Metres per pixel at this latitude, so the wedge keeps a constant size on
    // screen instead of shrinking to a dot as the map zooms out.
    const metersPerPixel =
      (156543.03392 * Math.cos((position.lat() * Math.PI) / 180)) / 2 ** zoom;
    const radius = Math.min(500, Math.max(8, CONE_PIXELS * metersPerPixel));

    const spread = fieldOfView(panorama.getZoom());
    const path: google.maps.LatLng[] = [position];
    const steps = 18;
    for (let step = 0; step <= steps; step++) {
      const heading = pov.heading - spread / 2 + (spread * step) / steps;
      path.push(geometryLibrary.spherical.computeOffset(position, radius, heading));
    }

    cone.setPath(path);
    cone.setMap(map);
  }, [map, geometryLibrary]);

  useEffect(() => {
    if (!map || !streetViewLibrary || !mapsLibrary || !containerRef.current) {
      return;
    }

    // Reuse across a StrictMode remount rather than building a second panorama
    // on the same container.
    if (!panoramaRef.current) {
      panoramaRef.current = new streetViewLibrary.StreetViewPanorama(
        containerRef.current,
        {
          visible: false,
          enableCloseButton: true,
          addressControl: true,
          fullscreenControl: false,
          motionTracking: false,
          motionTrackingControl: false,
        }
      );
      map.setStreetView(panoramaRef.current);
    }

    if (!coneRef.current) {
      coneRef.current = new mapsLibrary.Polygon({
        clickable: false,
        strokeColor: CONE_STROKE,
        strokeOpacity: 0.9,
        strokeWeight: 1.5,
        fillColor: CONE_FILL,
        fillOpacity: 0.35,
        zIndex: 5,
      });
    }

    const panorama = panoramaRef.current;
    const listeners = [
      panorama.addListener("visible_changed", () => {
        onVisibleChange(panorama.getVisible());
        updateCone();
      }),
      panorama.addListener("position_changed", updateCone),
      panorama.addListener("pov_changed", updateCone),
      panorama.addListener("zoom_changed", updateCone),
      map.addListener("zoom_changed", updateCone),
    ];

    updateCone();

    return () => {
      // Only the listeners are torn down. Destroying the panorama here would
      // break StrictMode's mount/remount the same way an eager teardown did in
      // DeckGlOverlay, and Pegman would lose its linked panorama.
      listeners.forEach((listener) => listener.remove());
    };
  }, [map, streetViewLibrary, mapsLibrary, onVisibleChange, updateCone]);

  return <div ref={containerRef} className="street-view-canvas" />;
}
