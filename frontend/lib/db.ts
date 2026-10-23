import { getCloudflareContext } from "@opennextjs/cloudflare";

// Only file that reads the D1 binding; everything else goes through lib/domain.
// Call inside functions only: bindings exist per request.
export const getEnv = () => {
  try {
    return getCloudflareContext().env;
  } catch {
    return process.env as unknown as ReturnType<typeof getCloudflareContext>["env"];
  }
};

export const getDb = () => {
  try {
    return getCloudflareContext().env.DB;
  } catch {
    return null as unknown as ReturnType<typeof getCloudflareContext>["env"]["DB"];
  }
};

