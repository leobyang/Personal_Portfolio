/**
 * Cloudflare Worker that holds the Spotify refresh token (as a Worker secret) so the
 * static site can show listening data without exposing credentials.
 *
 *   GET /now-playing  { isPlaying, track, artists, albumArt, url, playedAt }   cached 30 s
 *   GET /top          the build-time snapshot (top tracks/artists/albums)       cached 1 h
 *
 * Browsers must send an allowed Origin. Requests with no Origin (curl, the build
 * script) are allowed: everything served here is already public on the site.
 *
 * Secrets (wrangler secret put): SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
 * Vars (wrangler.toml):          ALLOWED_ORIGINS (comma-separated)
 */
import { buildSnapshot, fetchNowPlaying, refreshAccessToken } from "./spotify.js";

const ROUTES = {
  "/now-playing": { ttl: 30, load: fetchNowPlaying },
  "/top": { ttl: 3600, load: buildSnapshot },
};

// Per-isolate memory. The Cache API is a no-op on *.workers.dev, so this is the
// fallback there; on a custom-domain route both layers apply.
let tokenCache = { value: null, expiresAt: 0 };
const memory = new Map(); // path -> { body, expiresAt }

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
      ...corsHeaders(origin),
      ...extra,
    },
  });
}

async function getAccessToken(env) {
  const now = Date.now();
  if (tokenCache.value && now < tokenCache.expiresAt) return tokenCache.value;
  const { accessToken, expiresIn } = await refreshAccessToken({
    clientId: env.SPOTIFY_CLIENT_ID,
    clientSecret: env.SPOTIFY_CLIENT_SECRET,
    refreshToken: env.SPOTIFY_REFRESH_TOKEN,
  });
  // Refresh a minute early to avoid using a token that expires mid-request.
  tokenCache = { value: accessToken, expiresAt: now + (expiresIn - 60) * 1000 };
  return accessToken;
}

const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = allowedOrigin(request, env);
    const route = ROUTES[url.pathname];

    if (!route) {
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

    const { ttl, load } = route;
    const cacheControl = { "Cache-Control": `public, max-age=${ttl}` };
    const now = Date.now();

    const hit = memory.get(url.pathname);
    if (hit && now < hit.expiresAt) {
      return json(hit.body, 200, origin, { ...cacheControl, "X-Cache": "memory" });
    }

    const cache = caches.default;
    const cacheKey = new Request(`https://spotify.internal/v2${url.pathname}`);
    const cached = await cache.match(cacheKey);
    if (cached) {
      const body = await cached.json();
      memory.set(url.pathname, { body, expiresAt: now + ttl * 1000 });
      return json(body, 200, origin, { ...cacheControl, "X-Cache": "edge" });
    }

    try {
      const body = await load(await getAccessToken(env));
      memory.set(url.pathname, { body, expiresAt: now + ttl * 1000 });
      // Cache the origin-agnostic body; CORS headers are added per request.
      ctx.waitUntil(
        cache.put(
          cacheKey,
          new Response(JSON.stringify(body), {
            headers: { "Content-Type": "application/json", ...cacheControl },
          }),
        ),
      );
      return json(body, 200, origin, { ...cacheControl, "X-Cache": "miss" });
    } catch (err) {
      console.error(err);
      return json({ error: "upstream_error" }, 502, origin, { "Cache-Control": "no-store" });
    }
  },
};

export default worker;
