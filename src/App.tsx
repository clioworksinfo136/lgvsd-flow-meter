import { useCallback, useEffect, useState } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";
import type { FlowMeter, MeterDraft } from "./types";
import { draftToRecord } from "./meterFields";
import { FlowMeterMap, type PipeProperties } from "./components/FlowMeterMap";
import { PipeInfoPanel } from "./components/PipeInfoPanel";
import { StreetViewPane } from "./components/StreetViewPane";
import { FlowMeterForm } from "./components/FlowMeterForm";
import { GOOGLE_MAPS_API_KEY, MAPBOX_TILESET_ID } from "./config";
import "./App.css";

const client = generateClient<Schema>();

function MissingKeyNotice() {
  return (
    <div className="setup-notice">
      <h1>Map configuration needed</h1>
      <p>
        Set <code>VITE_GOOGLE_MAPS_API_KEY</code> and{" "}
        <code>VITE_MAPBOX_ACCESS_TOKEN</code> in a <code>.env.local</code> file,
        then restart the dev server. See <code>.env.example No use</code>.
      </p>
    </div>
  );
}

type FlowMeterAppProps = {
  signOut?: () => void;
  userEmail?: string;
};

function FlowMeterApp({ signOut, userEmail }: FlowMeterAppProps) {
  const [meters, setMeters] = useState<FlowMeter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickedLocation, setPickedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedPipe, setSelectedPipe] = useState<PipeProperties | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [streetViewOpen, setStreetViewOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const subscription = client.models.FlowMeter.observeQuery().subscribe({
      next: (data) => setMeters([...data.items]),
      error: (cause) =>
        setLoadError(
          cause instanceof Error ? cause.message : "Could not load meters."
        ),
    });
    return () => subscription.unsubscribe();
  }, []);

  async function createMeter(draft: MeterDraft) {
    const { errors } = await client.models.FlowMeter.create(
      draftToRecord(draft)
    );
    if (errors?.length) throw new Error(errors[0].message);
    setPickedLocation(null);
    setAddOpen(false);
  }

  const saveMeter = useCallback(async (id: string, draft: MeterDraft) => {
    const { errors } = await client.models.FlowMeter.update({
      id,
      ...draftToRecord(draft),
    });
    if (errors?.length) throw new Error(errors[0].message);
  }, []);

  // Memoized so the deck.gl layer is not rebuilt on every render.
  const handlePipeClick = useCallback(
    (properties: PipeProperties | null) => setSelectedPipe(properties),
    []
  );

  const deleteMeter = useCallback(async (id: string) => {
    const { errors } = await client.models.FlowMeter.delete({ id });
    if (errors?.length) throw new Error(errors[0].message);
    setSelectedId((current) => (current === id ? null : current));
  }, []);

  const locatedCount = meters.filter(
    (meter) => meter.latitude != null && meter.longitude != null
  ).length;

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="app-shell">
        <header className="app-header">
          <h1>LGVSD Flow Meters</h1>
          <div className="header-meta">
            <span>
              {locatedCount} of {meters.length} mapped
            </span>
            <code title="Mapbox tileset">{MAPBOX_TILESET_ID}</code>
            <button type="button" onClick={() => setAddOpen(true)}>
              Add
            </button>
            {userEmail && <span className="user-email">{userEmail}</span>}
            {signOut && (
              <button type="button" className="secondary" onClick={signOut}>
                Sign out
              </button>
            )}
          </div>
        </header>

        <div className={streetViewOpen ? "app-body split" : "app-body"}>
          <section className="map-pane">
            <FlowMeterMap
              meters={meters}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onPickLocation={(lat, lng) => setPickedLocation({ lat, lng })}
              onPipeClick={handlePipeClick}
              onSaveMeter={saveMeter}
              onDeleteMeter={deleteMeter}
            />
            <PipeInfoPanel
              properties={selectedPipe}
              onClose={() => setSelectedPipe(null)}
            />

            {addOpen && (
              <div className="add-panel">
                <header>
                  <strong>Add a meter</strong>
                  <button
                    type="button"
                    className="delete"
                    aria-label="Close"
                    onClick={() => setAddOpen(false)}
                  >
                    ×
                  </button>
                </header>
                <FlowMeterForm
                  pickedLocation={pickedLocation}
                  onSubmit={createMeter}
                />
              </div>
            )}

            {/* The list pane is gone, so a load failure surfaces over the map. */}
            {loadError && <p className="map-error">{loadError}</p>}
          </section>

          {/* Always mounted: Pegman needs its linked panorama to exist before
              it is dragged. The pane only takes width once it is visible. */}
          <section className="street-view-pane">
            <StreetViewPane onVisibleChange={setStreetViewOpen} />
          </section>
        </div>
      </div>
    </APIProvider>
  );
}

export default function App() {
  // Checked before the sign-in screen: without a Maps key there is nothing to
  // sign in to.
  if (!GOOGLE_MAPS_API_KEY) return <MissingKeyNotice />;

  return (
    <Authenticator loginMechanisms={["email"]}>
      {({ signOut, user }) => (
        <FlowMeterApp
          signOut={signOut}
          userEmail={user?.signInDetails?.loginId}
        />
      )}
    </Authenticator>
  );
}
