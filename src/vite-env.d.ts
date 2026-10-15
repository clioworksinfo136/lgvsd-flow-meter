/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google Maps JavaScript API key. Required — the map will not load without it. */
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  /** Map ID, required by AdvancedMarker. Defaults to Google's DEMO_MAP_ID. */
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;
  /** Mapbox public access token (pk.*). Required to fetch the tile overlay. */
  readonly VITE_MAPBOX_ACCESS_TOKEN: string;
  /** Mapbox tileset ID. Defaults to hazensawyer.9wms9cz6. */
  readonly VITE_MAPBOX_TILESET_ID?: string;
  /** Comma-separated source layers to read as gravity pipes. Unset = all. */
  readonly VITE_GRAVITY_PIPE_SOURCE_LAYERS?: string;
  /** Mapbox tileset ID for manholes. Defaults to hazensawyer.baw0qm3p. */
  readonly VITE_MANHOLE_TILESET_ID?: string;
  /** Comma-separated source layers to read as manholes. */
  readonly VITE_MANHOLE_SOURCE_LAYERS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
