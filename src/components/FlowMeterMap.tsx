import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
  InfoWindow,
  Map,
  Pin,
  useMap,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import type { PickingInfo } from "@deck.gl/core";
import type { FlowMeter, MeterDraft } from "../types";
import { MeterDetails } from "./MeterDetails";
import { DeckGlOverlay } from "./DeckGlOverlay";
import {
  createGravityPipeLayer,
  readPipeId,
  type PipeProperties,
} from "../layers/gravityPipes";
import { DEFAULT_CENTER, DEFAULT_ZOOM, GOOGLE_MAPS_MAP_ID } from "../config";

type Props = {
  meters: FlowMeter[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Fired when the user clicks bare map, so the form can pick up coordinates. */
  onPickLocation: (lat: number, lng: number) => void;
  onPipeClick: (properties: PipeProperties | null) => void;
  onSaveMeter: (id: string, draft: MeterDraft) => Promise<void>;
  onDeleteMeter: (id: string) => Promise<void>;
};

/** A meter is mappable only once it has both coordinates. */
function isLocated(
  meter: FlowMeter
): meter is FlowMeter & { latitude: number; longitude: number } {
  return meter.latitude != null && meter.longitude != null;
}

/** Zooms to fit all meters whenever the set of located meters changes. */
function FitBounds({ meters }: { meters: FlowMeter[] }) {
  const map = useMap();
  const located = meters.filter(isLocated);
  const signature = located
    .map((m) => `${m.latitude},${m.longitude}`)
    .sort()
    .join("|");

  useEffect(() => {
    if (!map || located.length === 0) return;

    if (located.length === 1) {
      map.setCenter({ lat: located[0].latitude, lng: located[0].longitude });
      map.setZoom(DEFAULT_ZOOM);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    for (const meter of located) {
      bounds.extend({ lat: meter.latitude, lng: meter.longitude });
    }
    map.fitBounds(bounds, 64);
    // `signature` stands in for the coordinate list; `located` is a new array
    // every render and would loop forever as a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature]);

  return null;
}

export type { PipeProperties };

export function FlowMeterMap({
  meters,
  selectedId,
  onSelect,
  onPickLocation,
  onPipeClick,
  onSaveMeter,
  onDeleteMeter,
}: Props) {
  const [draftPin, setDraftPin] = useState<google.maps.LatLngLiteral | null>(
    null
  );
  const [hoveredPipeId, setHoveredPipeId] = useState<string | number | null>(
    null
  );

  const located = meters.filter(isLocated);
  const selected = located.find((meter) => meter.id === selectedId) ?? null;

  const layers = useMemo(
    () => [
      createGravityPipeLayer({
        selectedId: hoveredPipeId,
        onHover: (info: PickingInfo) => {
          const properties = (info.object as { properties?: PipeProperties })
            ?.properties;
          setHoveredPipeId(properties ? readPipeId(properties) : null);
        },
        onClick: (info: PickingInfo) => {
          const properties = (info.object as { properties?: PipeProperties })
            ?.properties;
          if (!properties) return;
          onPipeClick(properties);
        },
      }),
    ],
    [hoveredPipeId, onPipeClick]
  );

  const handleMapClick = useCallback(
    (event: MapMouseEvent) => {
      // GoogleMapsOverlay listens on the same map click as <Map onClick>, so a
      // click landing on a pipe would also drop a draft location pin. deck.gl's
      // hover handler has already flagged the pipe under the cursor, so treat
      // this click as the pipe's and leave the form alone.
      if (hoveredPipeId != null) return;
      const position = event.detail.latLng;
      if (!position) return;
      setDraftPin(position);
      onPickLocation(position.lat, position.lng);
      onSelect(null);
    },
    [hoveredPipeId, onPickLocation, onSelect]
  );

  return (
    <Map
      // Addressable id so the Street View pane, which sits outside <Map>, can
      // reach this instance with useMap("main").
      id="main"
      mapId={GOOGLE_MAPS_MAP_ID}
      defaultCenter={DEFAULT_CENTER}
      defaultZoom={DEFAULT_ZOOM}
      gestureHandling="greedy"
      mapTypeControl
      mapTypeId="roadmap"
      className="map-canvas"
      onClick={handleMapClick}
    >
      <DeckGlOverlay layers={layers} />
      <FitBounds meters={meters} />

      {located.map((meter) => (
        <AdvancedMarker
          key={meter.id}
          position={{ lat: meter.latitude, lng: meter.longitude }}
          title={meter.meterID ?? undefined}
          // A circle marks its position with its middle, not with a tip the way
          // the default balloon does.
          anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
          onClick={() => onSelect(meter.id)}
        >
          <span
            className={
              meter.id === selectedId ? "meter-dot selected" : "meter-dot"
            }
          />
        </AdvancedMarker>
      ))}

      {draftPin && (
        <AdvancedMarker position={draftPin} title="New meter location">
          <Pin background="#10b981" borderColor="#065f46" glyphColor="#ffffff" />
        </AdvancedMarker>
      )}

      {selected && (
        <InfoWindow
          position={{ lat: selected.latitude, lng: selected.longitude }}
          onCloseClick={() => onSelect(null)}
          headerContent={<strong>{selected.meterID ?? "Unnamed meter"}</strong>}
        >
          <div className="info-window">
            <MeterDetails
              meter={selected}
              onSave={onSaveMeter}
              onDelete={onDeleteMeter}
            />
          </div>
        </InfoWindow>
      )}
    </Map>
  );
}
