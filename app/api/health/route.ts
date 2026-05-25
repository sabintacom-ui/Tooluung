import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Check = { name: string; ok: boolean; detail?: string };

function envCheck(name: string): Check {
  const value = process.env[name];
  return { name, ok: Boolean(value && value.trim()), detail: value ? "set" : "missing" };
}

export async function GET() {
  const checks: Check[] = [
    envCheck("ADMIN_API_TOKEN"),
    envCheck("WORKER_SECRET"),
    envCheck("SUPABASE_URL"),
    envCheck("SUPABASE_SERVICE_ROLE_KEY"),
    envCheck("GOOGLE_CLIENT_ID"),
    envCheck("GOOGLE_CLIENT_SECRET"),
    envCheck("GOOGLE_REFRESH_TOKEN"),
    envCheck("SSH_HOST"),
    envCheck("SSH_USER"),
    envCheck("WORKER_PUBLIC_BASE_URL"),
  ];

  // SSH key check (either privatekey or password must be present)
  const sshAuth = Boolean(process.env.SSH_PRIVATE_KEY || process.env.SSH_PRIVATE_KEY_B64 || process.env.SSH_PASSWORD);
  checks.push({ name: "SSH_AUTH", ok: sshAuth, detail: sshAuth ? "configured" : "missing SSH_PRIVATE_KEY[_B64] or SSH_PASSWORD" });

  // Snifox optional but recommended
  const snifox = Boolean(process.env.SNIFOX_API_KEY);
  checks.push({ name: "SNIFOX_API_KEY", ok: snifox, detail: snifox ? "set (script gen via LLM)" : "missing (will use template fallback)" });

  const allOk = checks.every((check) => check.ok);
  return NextResponse.json(
    {
      ok: allOk,
      uptime_s: Math.round(process.uptime()),
      node: process.version,
      env: process.env.VERCEL_ENV ?? "local",
      region: process.env.VERCEL_REGION ?? "local",
      checks,
    },
    { status: allOk ? 200 : 503 },
  );
}
