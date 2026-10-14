import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== SCHEMA ===============================================================
A FlowMeter record describes a single metering location. The authorization
rule below specifies that any user authenticated via an API key can
"create", "read", "update", and "delete" any "FlowMeter" records.
=========================================================================*/
const schema = a.schema({
  FlowMeter: a
    .model({
      content: a.string(),
      meterID: a.string(),
      latitude: a.float(),
      longitude: a.float(),
      notes: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== CLIENT USAGE =========================================================
From your client-side code, generate a Data client to make CRUDL requests:

  import { generateClient } from "aws-amplify/data";
  import type { Schema } from "../amplify/data/resource";

  const client = generateClient<Schema>();
  const { data: meters } = await client.models.FlowMeter.list();

Using JavaScript or Next.js React Server Components, Middleware, Server
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/
