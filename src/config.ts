/** Mapbox vector tileset holding the gravity sewer network. */
export const MAPBOX_TILESET_ID =
  import.meta.env.VITE_MAPBOX_TILESET_ID ?? "hazensawyer.9wms9cz6";

export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? "";

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

/** AdvancedMarker requires a map ID; DEMO_MAP_ID is Google's dev placeholder. */
export const GOOGLE_MAPS_MAP_ID =
  import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";

/**
 * Initial view: centre of the gravity tileset's own bounds
 * (bounds -122.5983,37.9868 .. -122.5051,38.0453, per its TileJSON).
 * Overridden as soon as any meter with coordinates loads.
 */
export const DEFAULT_CENTER = { lat: 38.0161, lng: -122.5517 };
export const DEFAULT_ZOOM = 14;

/** The tileset is built to zoom 16; deck.gl over-zooms past this. */
export const GRAVITY_PIPE_MAX_ZOOM = 16;

/**
 * Source layer(s) inside the vector tileset to decode as gravity pipes.
 * Comma-separated. Defaults to the tileset's only source layer.
 */
const rawSourceLayers = import.meta.env.VITE_GRAVITY_PIPE_SOURCE_LAYERS?.trim();
export const GRAVITY_PIPE_SOURCE_LAYERS = rawSourceLayers
  ? rawSourceLayers.split(",").map((name) => name.trim()).filter(Boolean)
  : ["lgvsd-gravity-basq8c"];
