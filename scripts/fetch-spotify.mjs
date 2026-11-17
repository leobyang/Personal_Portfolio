#!/usr/bin/env node
/**
 * Build-time Spotify snapshot → src/data/spotify.json (gitignored).
 *
 * Tries, in order:
 *   1. Spotify directly, if SPOTIFY_CLIENT_ID / _SECRET / _REFRESH_TOKEN are set (CI).
 *   2. The Worker's /top route, derived from NEXT_PUBLIC_NOW_PLAYING_URL (local dev:
 *      `npm run dev` loads it from .env.local, so no secrets are needed on disk).
 *   3. src/data/spotify.sample.json.
 * Always exits 0, so the site build never breaks.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSnapshot, refreshAccessToken } from "../worker/src/spotify.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src/data/spotify.json");
const SAMPLE = path.join(root, "src/data/spotify.sample.json");

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN, NEXT_PUBLIC_NOW_PLAYING_URL } =
  process.env;

function isSnapshot(v) {
  return (
    v && typeof v === "object" && Array.isArray(v.topTracks) && Array.isArray(v.topArtists) &&
    Array.isArray(v.topAlbums)
  );
}

async function fromSpotify() {
  const { accessToken } = await refreshAccessToken({
    clientId: SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY_CLIENT_SECRET,
    refreshToken: SPOTIFY_REFRESH_TOKEN,
  });
  return buildSnapshot(accessToken);
}

async function fromWorker() {
  const url = new URL("/top", NEXT_PUBLIC_NOW_PLAYING_URL);
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  const body = await res.json();
  if (!isSnapshot(body)) throw new Error(`${url} returned an unexpected shape`);
  return body;
}

async function main() {
  const sources = [];
  if (SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET && SPOTIFY_REFRESH_TOKEN) {
    sources.push(["Spotify", fromSpotify]);
  }
  if (NEXT_PUBLIC_NOW_PLAYING_URL) sources.push(["the now-playing Worker", fromWorker]);

  for (const [name, load] of sources) {
    try {
      const data = await load();
      await fs.writeFile(OUT, JSON.stringify(data, null, 2) + "\n");
      console.log(
        `[fetch-spotify] Wrote ${path.relative(root, OUT)} from ${name}: ` +
          `${data.topTracks.length} tracks, ${data.topArtists.length} artists, ${data.topAlbums.length} albums.`,
      );
      return;
    } catch (err) {
      console.warn(`[fetch-spotify] ${name} failed: ${err.message}`);
    }
  }

  console.warn("[fetch-spotify] No Spotify source available. Using spotify.sample.json.");
  await fs.copyFile(SAMPLE, OUT);
}

main().catch(async (err) => {
  console.error("[fetch-spotify] Unexpected error:", err);
  try {
    await fs.copyFile(SAMPLE, OUT);
  } catch {
    /* the site falls back to the sample at render time anyway */
  }
  process.exit(0);
});
