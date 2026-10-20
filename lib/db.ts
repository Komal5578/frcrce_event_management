import { getCloudflareContext } from "@opennextjs/cloudflare";

// Only file that reads the D1 binding; everything else goes through lib/domain.
// Call inside functions only: bindings exist per request.
export const getEnv = () => getCloudflareContext().env;
export const getDb = () => getCloudflareContext().env.DB;
