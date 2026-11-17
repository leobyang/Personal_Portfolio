/**
 * Cloudflare Worker: GET /now-playing
 *
 * Holds the Spotify refresh token (as a Worker secret) so the static site can show
 * what's playing without exposing credentials.
 *
 * Response: { isPlaying, track, artists, albumArt, url, playedAt }
 *
 * Secrets (wrangler secret put): SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
 * Vars (wrangler.toml):          ALLOWED_ORIGINS (comma-separated)
 */

const API = "https://api.spotify.com/v1";
const RESPONSE_TTL_SECONDS = 30;
const CACHE_KEY = "https://now-playing.internal/v1";

// Per-isolate memory. The Cache API is a no-op on *.workers.dev, so this is the
// fallback there; on a custom-domain route both layers apply.
let tokenCache = { value: null, expiresAt: 0 };
let memoryResponse = { body: null, expiresAt: 0 };

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS ?? "https://leoyang.me,http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return origin && allowed.includes(origin) ? origin : null;
}

function corsHeaders(origin) {
  const headers = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(body, status, origin, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${RESPONSE_TTL_SECONDS}`,
      ...corsHeaders(origin),
      ...extra,
    },
  });
}

async function getAccessToken(env) {
  const now = Date.now();
  if (tokenCache.value && now < tokenCache.expiresAt) return tokenCache.value;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: env.SPOTIFY_REFRESH_TOKEN,
    }),
  });
  if (!res.ok) throw new Error(`token refresh failed (${res.status})`);
  const body = await res.json();
  // Refresh a minute early to avoid using a token that expires mid-request.
  tokenCache = { value: body.access_token, expiresAt: now + (body.expires_in - 60) * 1000 };
  return tokenCache.value;
}

function pickImage(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  return [...images].sort(
    (a, b) => Math.abs((a.width ?? 300) - 300) - Math.abs((b.width ?? 300) - 300),
  )[0]?.url ?? null;
}

function shapeTrack(track, isPlaying, playedAt) {
  return {
    isPlaying,
    track: track.name,
    artists: (track.artists ?? []).map((a) => a.name),
    albumArt: pickImage(track.album?.images),
    url: track.external_urls?.spotify ?? null,
    playedAt,
  };
}

async function fetchNowPlaying(env) {
  const token = await getAccessToken(env);
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const current = await fetch(`${API}/me/player/currently-playing`, auth);
  let paused = null;
  if (current.status === 200) {
    const body = await current.json();
    if (body?.item && body.currently_playing_type === "track") {
      if (body.is_playing) return shapeTrack(body.item, true, new Date().toISOString());
      paused = body.item;
    }
  } else if (current.status !== 204) {
    throw new Error(`currently-playing failed (${current.status})`);
  }

  const recent = await fetch(`${API}/me/player/recently-played?limit=1`, auth);
  if (!recent.ok) throw new Error(`recently-played failed (${recent.status})`);
  const body = await recent.json();
  const last = body.items?.[0];
  if (last) return shapeTrack(last.track, false, last.played_at);
  if (paused) return shapeTrack(paused, false, null);
  return { isPlaying: false, track: null, artists: [], albumArt: null, url: null, playedAt: null };
}

const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = allowedOrigin(request, env);

    if (url.pathname !== "/now-playing") {
      return json({ error: "not_found" }, 404, origin, { "Cache-Control": "no-store" });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: origin ? 204 : 403, headers: corsHeaders(origin) });
    }
    if (request.method !== "GET") {
      return json({ error: "method_not_allowed" }, 405, origin, { Allow: "GET, OPTIONS" });
    }
    if (request.headers.get("Origin") && !origin) {
      return json({ error: "origin_not_allowed" }, 403, null, { "Cache-Control": "no-store" });
    }

    const now = Date.now();
    if (memoryResponse.body && now < memoryResponse.expiresAt) {
      return json(memoryResponse.body, 200, origin, { "X-Cache": "memory" });
    }

    const cache = caches.default;
    const cacheKey = new Request(CACHE_KEY);
    const cached = await cache.match(cacheKey);
    if (cached) {
      const body = await cached.json();
      memoryResponse = { body, expiresAt: now + RESPONSE_TTL_SECONDS * 1000 };
      return json(body, 200, origin, { "X-Cache": "edge" });
    }

    try {
      const body = await fetchNowPlaying(env);
      memoryResponse = { body, expiresAt: now + RESPONSE_TTL_SECONDS * 1000 };
      // Cache the origin-agnostic body; CORS headers are added per request.
      ctx.waitUntil(
        cache.put(
          cacheKey,
          new Response(JSON.stringify(body), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": `public, max-age=${RESPONSE_TTL_SECONDS}`,
            },
          }),
        ),
      );
      return json(body, 200, origin, { "X-Cache": "miss" });
    } catch (err) {
      console.error(err);
      return json({ error: "upstream_error" }, 502, origin, { "Cache-Control": "no-store" });
    }
  },
};

export default worker;
