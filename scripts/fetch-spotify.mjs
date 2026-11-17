#!/usr/bin/env node
/**
 * Build-time Spotify snapshot → src/data/spotify.json (gitignored).
 *
 * Needs SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN.
 * If any are missing, or Spotify fails, it copies src/data/spotify.sample.json
 * instead and exits 0, so the site build never breaks.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src/data/spotify.json");
const SAMPLE = path.join(root, "src/data/spotify.sample.json");
const API = "https://api.spotify.com/v1";

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

async function writeSample(reason) {
  console.warn(`[fetch-spotify] ${reason}. Using spotify.sample.json.`);
  await fs.copyFile(SAMPLE, OUT);
}

async function getAccessToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: SPOTIFY_REFRESH_TOKEN }),
  });
  if (!res.ok) throw new Error(`token refresh failed (${res.status})`);
  const body = await res.json();
  return body.access_token;
}

async function api(token, endpoint) {
  const res = await fetch(`${API}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`${endpoint} failed (${res.status})`);
  return res.json();
}

/** Pick the image closest to 300px wide (Spotify album art comes as 640/300/64). */
function pickImage(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const best = [...images].sort(
    (a, b) => Math.abs((a.width ?? 300) - 300) - Math.abs((b.width ?? 300) - 300),
  )[0];
  return best?.url ?? null;
}

const artistNames = (artists) => (artists ?? []).map((a) => a.name);

function deriveTopAlbums(tracks, limit = 5) {
  const n = tracks.length;
  const albums = new Map();
  tracks.forEach((track, i) => {
    const album = track.album;
    if (!album?.id) return;
    const score = n - i; // reversed rank: #1 of 50 scores 50, #50 scores 1
    const entry = albums.get(album.id) ?? {
      name: album.name,
      artists: artistNames(album.artists),
      image: pickImage(album.images),
      url: album.external_urls?.spotify ?? null,
      score: 0,
      firstSeen: i,
    };
    entry.score += score;
    albums.set(album.id, entry);
  });
  return [...albums.values()]
    .sort((a, b) => b.score - a.score || a.firstSeen - b.firstSeen)
    .slice(0, limit)
    .map(({ name, artists, image, url }) => ({ name, artists, image, url }));
}

async function main() {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    await writeSample("Spotify env vars not set");
    return;
  }

  try {
    const token = await getAccessToken();
    const [tracks, artists, recent] = await Promise.all([
      api(token, "/me/top/tracks?time_range=short_term&limit=50"),
      api(token, "/me/top/artists?time_range=short_term&limit=5"),
      api(token, "/me/player/recently-played?limit=1"),
    ]);

    const trackItems = tracks.items ?? [];
    const last = recent.items?.[0];

    const data = {
      source: "spotify",
      fetchedAt: new Date().toISOString(),
      topTracks: trackItems.slice(0, 5).map((t) => ({
        name: t.name,
        artists: artistNames(t.artists),
        image: pickImage(t.album?.images),
        url: t.external_urls?.spotify ?? null,
      })),
      topArtists: (artists.items ?? []).slice(0, 5).map((a) => ({
        name: a.name,
        image: pickImage(a.images),
        url: a.external_urls?.spotify ?? null,
      })),
      topAlbums: deriveTopAlbums(trackItems),
      lastPlayed: last
        ? {
            track: last.track.name,
            artists: artistNames(last.track.artists),
            albumArt: pickImage(last.track.album?.images),
            url: last.track.external_urls?.spotify ?? null,
            playedAt: last.played_at,
          }
        : null,
    };

    await fs.writeFile(OUT, JSON.stringify(data, null, 2) + "\n");
    console.log(
      `[fetch-spotify] Wrote ${path.relative(root, OUT)}: ${data.topTracks.length} tracks, ` +
        `${data.topArtists.length} artists, ${data.topAlbums.length} albums.`,
    );
  } catch (err) {
    await writeSample(`Spotify request failed: ${err.message}`);
  }
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
