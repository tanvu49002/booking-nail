import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

function parseDotEnv(contents: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) result[key] = value;
  }

  return result;
}

function getPublicApiEnvFromBookingNailApi(): {
  apiUrl: string;
  cdnUrl: string;
} {
  const apiEnvPath = path.resolve(process.cwd(), "..", "booking-nail-api", ".env");
  const fallbackHost = "localhost";
  const fallbackPort = "1337";

  try {
    if (!fs.existsSync(apiEnvPath)) {
      const base = `http://${fallbackHost}:${fallbackPort}`;
      return { apiUrl: `${base}/api`, cdnUrl: base };
    }

    const env = parseDotEnv(fs.readFileSync(apiEnvPath, "utf8"));

    const rawHost = env.HOST || fallbackHost;
    const host =
      rawHost === "0.0.0.0" || rawHost === "::" || rawHost === "127.0.0.1"
        ? "localhost"
        : rawHost;
    const port = env.PORT || fallbackPort;

    const base = `http://${host}:${port}`;
    return { apiUrl: `${base}/api`, cdnUrl: base };
  } catch {
    const base = `http://${fallbackHost}:${fallbackPort}`;
    return { apiUrl: `${base}/api`, cdnUrl: base };
  }
}

const derived = getPublicApiEnvFromBookingNailApi();

const nextConfig: NextConfig = {
  env: {
    // Prefer `booking-nail/.env` to avoid accidental mismatches; fall back to `booking-nail-api/.env` only when unset.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? derived.apiUrl,
    NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL ?? derived.cdnUrl,
  },
};

export default nextConfig;
