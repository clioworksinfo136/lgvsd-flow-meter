import { defineStorage } from "@aws-amplify/backend";

/**
 * Define and configure your storage resource
 * @see https://docs.amplify.aws/react/build-a-backend/storage
 *
 * Paths:
 *  - flow-meters/*            shared meter attachments (photos, readings, logs)
 *  - flow-meters/{meterId}/*  nothing special at the IAM level; the prefix is a
 *                             convention so files group by meter
 *  - private/{entity_id}/*    per-user scratch space; {entity_id} is replaced
 *                             with the caller's Cognito identity ID, so one
 *                             user cannot reach another user's objects
 */
export const storage = defineStorage({
  name: "flowMeterFiles",
  access: (allow) => ({
    "flow-meters/*": [allow.authenticated.to(["read", "write", "delete"])],
    "private/{entity_id}/*": [allow.entity("identity").to(["read", "write", "delete"])],
  }),
});
