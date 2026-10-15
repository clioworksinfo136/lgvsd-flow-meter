import { MVTLayer } from "@deck.gl/geo-layers";
import type { PickingInfo } from "@deck.gl/core";
import {
  MANHOLE_MAX_ZOOM,
  MANHOLE_SOURCE_LAYERS,
  MANHOLE_TILESET_ID,
  MAPBOX_ACCESS_TOKEN,
} from "../config";
import type { PipeProperties } from "./gravityPipes";

/** Attribute names come from the tileset's own schema (see its TileJSON). */
const ID_KEYS = ["OBJECTID", "FACILITYID", "OASISID", "GPSPOINTID"];

export function readManholeId(
  properties: PipeProperties
): string | number | null {
  for (const key of ID_KEYS) {
    const raw = properties?.[key];
    if (raw != null && raw !== "") return raw;
  }
  return null;
}

type Options = {
  /** Currently hovered manhole, highlighted in amber. */
  selectedId: string | number | null;
  onHover: (info: PickingInfo) => void;
  onClick: (info: PickingInfo) => void;
};

/**
 * Manhole structures, read as vector tiles from the Mapbox tileset.
 *
 * Drawn after the pipes so the structures sit on top of the mains they join,
 * and sized in pixels so they stay legible at every zoom.
 */
export function createManholeLayer({ selectedId, onHover, onClick }: Options) {
  return new MVTLayer({
    id: "manholes",
    data: `https://api.mapbox.com/v4/${MANHOLE_TILESET_ID}/{z}/{x}/{y}.mvt?access_token=${MAPBOX_ACCESS_TOKEN}`,

    // The tileset stops at z16; without this deck.gl requests z17+ and 404s.
    maxZoom: MANHOLE_MAX_ZOOM,
    loadOptions: { mvt: { layers: MANHOLE_SOURCE_LAYERS } },

    pointType: "circle",
    filled: true,
    stroked: true,
    pickable: true,
    autoHighlight: true,
    highlightColor: [245, 158, 11, 230],

    pointRadiusUnits: "pixels",
    getPointRadius: 4,
    pointRadiusMinPixels: 2.5,
    pointRadiusMaxPixels: 9,

    // White ring so a structure reads clearly against the blue mains beneath it.
    lineWidthUnits: "pixels",
    getLineWidth: 1.2,
    getLineColor: [255, 255, 255, 230],

    getFillColor: (feature: { properties: PipeProperties }) => {
      const id = readManholeId(feature.properties ?? {});
      return selectedId != null && id === selectedId
        ? [245, 158, 11, 255]
        : [13, 148, 136, 230];
    },

    // getFillColor closes over selectedId, so deck.gl needs telling when to
    // re-evaluate it; without this the highlight never repaints.
    updateTriggers: {
      getFillColor: [selectedId],
    },

    onHover,
    onClick,

    /** Empty tiles 404 by design; only surface the real failures. */
    onTileError: (error: Error) => {
      if (error?.message?.includes("404")) return;
      console.error("Manhole tile failed to load:", error);
    },
  });
}
