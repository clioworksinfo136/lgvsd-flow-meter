import { MVTLayer } from "@deck.gl/geo-layers";
import type { PickingInfo } from "@deck.gl/core";
import {
  GRAVITY_PIPE_MAX_ZOOM,
  GRAVITY_PIPE_SOURCE_LAYERS,
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_TILESET_ID,
} from "../config";

export type PipeProperties = Record<string, string | number | null>;

export type PipeFeature = {
  properties: PipeProperties;
};

/**
 * Attribute names come from the tileset's own schema (see its TileJSON).
 * DIAMETER is typed String there, so values may read "8" or "8 IN" — parseFloat
 * tolerates both, where Number("8 IN") would yield NaN.
 */
const DIAMETER_KEYS = ["DIAMETER", "diameter", "PIPE_SIZE", "pipe_size"];
const ID_KEYS = ["OBJECTID", "ID", "GISPIPEID", "FACILITYID"];

function readDiameter(properties: PipeProperties): number | null {
  for (const key of DIAMETER_KEYS) {
    const raw = properties?.[key];
    if (raw == null || raw === "") continue;
    const value = typeof raw === "number" ? raw : parseFloat(raw);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

export function readPipeId(properties: PipeProperties): string | number | null {
  for (const key of ID_KEYS) {
    const raw = properties?.[key];
    if (raw != null && raw !== "") return raw;
  }
  return null;
}

/** Inches of diameter → metres of rendered width, clamped to stay legible. */
function widthForDiameter(diameter: number | null): number {
  if (diameter == null) return 1.5;
  return Math.min(6, Math.max(0.8, diameter / 8));
}

type Options = {
  /** Currently hovered/selected pipe, highlighted in amber. */
  selectedId: string | number | null;
  onHover: (info: PickingInfo) => void;
  onClick: (info: PickingInfo) => void;
};

/**
 * Gravity sewer mains, read as vector tiles straight from the Mapbox tileset.
 *
 * Mapbox serves MVT at /v4/{tileset}/{z}/{x}/{y}.mvt. deck.gl fetches and
 * decodes the tiles itself, so no Mapbox GL JS is involved and the layer
 * composites over the Google base map through GoogleMapsOverlay.
 *
 * Mapbox returns 404 for tiles that contain no features, which is normal for a
 * district-sized dataset; those surface as console noise, not missing geometry.
 */
export function createGravityPipeLayer({
  selectedId,
  onHover,
  onClick,
}: Options) {
  return new MVTLayer({
    id: "gravity-pipes",
    data: `https://api.mapbox.com/v4/${MAPBOX_TILESET_ID}/{z}/{x}/{y}.mvt?access_token=${MAPBOX_ACCESS_TOKEN}`,

    // The tileset stops at z16; without this deck.gl requests z17+ and 404s.
    maxZoom: GRAVITY_PIPE_MAX_ZOOM,

    // Decode only the sewer source layer, so unrelated layers are never drawn
    // as pipes if the tileset later grows.
    loadOptions: { mvt: { layers: GRAVITY_PIPE_SOURCE_LAYERS } },

    stroked: true,
    filled: false,
    pickable: true,
    autoHighlight: true,
    highlightColor: [245, 158, 11, 220],

    lineWidthUnits: "meters",
    lineWidthMinPixels: 1.5,
    lineWidthMaxPixels: 10,
    lineJointRounded: true,
    lineCapRounded: true,

    getLineWidth: (feature: PipeFeature) =>
      widthForDiameter(readDiameter(feature.properties ?? {})),

    getLineColor: (feature: PipeFeature) => {
      const id = readPipeId(feature.properties ?? {});
      return selectedId != null && id === selectedId
        ? [245, 158, 11, 255]
        : [37, 99, 235, 220];
    },

    // getLineColor closes over selectedId, so deck.gl needs to be told when to
    // re-evaluate it; without this the highlight never repaints.
    updateTriggers: {
      getLineColor: [selectedId],
    },

    onHover,
    onClick,

    /**
     * Mapbox 404s tiles that hold no features, which is routine for a
     * district-sized dataset and would otherwise fill the console. Only 404 is
     * swallowed — 401/403 from a bad or unscoped token still surface.
     */
    onTileError: (error: Error) => {
      if (error?.message?.includes("404")) return;
      console.error("Gravity pipe tile failed to load:", error);
    },
  });
}

export { readDiameter };
