/**
 * Spotify helpers shared by the Worker (worker/src/index.js) and the build-time
 * snapshot script (scripts/fetch-spotify.mjs). Plain ESM with only web APIs
 * (fetch, btoa), so it runs in both workerd and Node.
 */

export const API = "https://api.spotify.com/v1";

/** Exchange the long-lived refresh token for an access token. */
export async function refreshAccessToken({ clientId, clientSecret, refreshToken }) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error(`token refresh failed (${res.status})`);
  const body = await res.json();
  return { accessToken: body.access_token, expiresIn: body.expires_in };
}

async function api(token, endpoint) {
  const res = await fetch(`${API}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`${endpoint} failed (${res.status})`);
  return res.json();
}

/** Pick the image closest to `target` px wide (Spotify art comes as 640/300/64). */
export function pickImage(images, target = 300) {
  if (!Array.isArray(images) || images.length === 0) return null;
  return (
    [...images].sort(
      (a, b) => Math.abs((a.width ?? target) - target) - Math.abs((b.width ?? target) - target),
    )[0]?.url ?? null
  );
}

const artistNames = (artists) => (artists ?? []).map((a) => a.name);

/** Rank albums by summing reversed ranks of their tracks in the top 50. */
function deriveTopAlbums(tracks, limit = 5) {
  const n = tracks.length;
  const albums = new Map();
  tracks.forEach((track, i) => {
    const album = track.album;
    if (!album?.id) return;
    const entry = albums.get(album.id) ?? {
      name: album.name,
      artists: artistNames(album.artists),
      image: pickImage(album.images, 640),
      url: album.external_urls?.spotify ?? null,
      score: 0,
      firstSeen: i,
    };
    entry.score += n - i; // #1 of 50 scores 50, #50 scores 1
    albums.set(album.id, entry);
  });
  return [...albums.values()]
    .sort((a, b) => b.score - a.score || a.firstSeen - b.firstSeen)
    .slice(0, limit)
    .map(({ name, artists, image, url }) => ({ name, artists, image, url }));
}

/**
 * The snapshot the site renders at build time:
 * { source, fetchedAt, topTracks, topArtists, topAlbums, lastPlayed }.
 */
export async function buildSnapshot(token) {
  const [tracks, artists, recent] = await Promise.all([
    api(token, "/me/top/tracks?time_range=short_term&limit=50"),
    api(token, "/me/top/artists?time_range=short_term&limit=5"),
    api(token, "/me/player/recently-played?limit=1"),
  ]);
  const trackItems = tracks.items ?? [];
  const last = recent.items?.[0];

  return {
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
      image: pickImage(a.images, 640),
      url: a.external_urls?.spotify ?? null,
    })),
    topAlbums: deriveTopAlbums(trackItems),
    lastPlayed: last
      ? {
          track: last.track.name,
          artists: artistNames(last.track.artists),
          albumArt: pickImage(last.track.album?.images, 640),
          url: last.track.external_urls?.spotify ?? null,
          playedAt: last.played_at,
        }
      : null,
  };
}

/** Currently playing, falling back to the last played track. */
export async function fetchNowPlaying(token) {
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const shape = (track, isPlaying, playedAt) => ({
    isPlaying,
    track: track.name,
    artists: artistNames(track.artists),
    albumArt: pickImage(track.album?.images, 640),
    url: track.external_urls?.spotify ?? null,
    playedAt,
  });

  const current = await fetch(`${API}/me/player/currently-playing`, auth);
  let paused = null;
  if (current.status === 200) {
    const body = await current.json();
    if (body?.item && body.currently_playing_type === "track") {
      if (body.is_playing) return shape(body.item, true, new Date().toISOString());
      paused = body.item;
    }
  } else if (current.status !== 204) {
    throw new Error(`currently-playing failed (${current.status})`);
  }

  const recent = await fetch(`${API}/me/player/recently-played?limit=1`, auth);
  if (!recent.ok) throw new Error(`recently-played failed (${recent.status})`);
  const body = await recent.json();
  const last = body.items?.[0];
  if (last) return shape(last.track, false, last.played_at);
  if (paused) return shape(paused, false, null);
  return { isPlaying: false, track: null, artists: [], albumArt: null, url: null, playedAt: null };
}
