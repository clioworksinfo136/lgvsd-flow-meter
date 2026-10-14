import type { Schema } from "../amplify/data/resource";

export type FlowMeter = Schema["FlowMeter"]["type"];

/** Form state is all strings; it is parsed on submit. */
export type MeterDraft = {
  content: string;
  meterID: string;
  latitude: string;
  longitude: string;
  notes: string;
};

export const emptyDraft: MeterDraft = {
  content: "",
  meterID: "",
  latitude: "",
  longitude: "",
  notes: "",
};
