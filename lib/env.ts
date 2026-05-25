import "server-only";

/**
 * Validates required environment variables at startup.
 * Throws clear errors so production deployments fail-fast instead of
 * crashing deep in request handlers.
 */

type EnvScope = "core" | "supabase" | "google" | "ssh" | "gas";

const REQUIRED: Record<EnvScope, string[]> = {
  core: ["ADMIN_API_TOKEN", "WORKER_SECRET"],
  supabase: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
  google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"],
  ssh: ["SSH_HOST", "SSH_USER"],
  gas: ["GAS_WEB_APP_URL", "GAS_WEBHOOK_SECRET"],
};

export function checkEnv(scopes: EnvScope[]): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const scope of scopes) {
    for (const key of REQUIRED[scope]) {
      if (!process.env[key]) missing.push(key);
    }
  }
  // SSH additional: must have key OR password
  if (scopes.includes("ssh")) {
    if (!process.env.SSH_PRIVATE_KEY && !process.env.SSH_PASSWORD) {
      missing.push("SSH_PRIVATE_KEY|SSH_PASSWORD");
    }
  }
  return { ok: missing.length === 0, missing };
}

export function assertEnv(scopes: EnvScope[]) {
  const { ok, missing } = checkEnv(scopes);
  if (!ok) throw new Error(`Missing required env: ${missing.join(", ")}`);
}

export function getMinLengthOrThrow(key: string, minLength: number) {
  const value = process.env[key];
  if (!value || value.length < minLength) {
    throw new Error(`${key} must be at least ${minLength} chars`);
  }
  return value;
}

/**
 * Production hardening check — called at startup of critical routes.
 * Returns true if all production prerequisites are met.
 */
export function isProductionReady(): { ready: boolean; issues: string[] } {
  const issues: string[] = [];
  const env = process.env.NODE_ENV ?? "development";

  if (env === "production") {
    // Secrets must be long enough
    const longSecrets = ["ADMIN_API_TOKEN", "WORKER_SECRET", "GAS_WEBHOOK_SECRET"];
    for (const key of longSecrets) {
      const value = process.env[key];
      if (!value) issues.push(`${key} not set`);
      else if (value.length < 32) issues.push(`${key} too short (<32 chars)`);
      else if (/change-me|test|secret|password/i.test(value)) issues.push(`${key} looks like placeholder`);
    }
  }

  return { ready: issues.length === 0, issues };
}
