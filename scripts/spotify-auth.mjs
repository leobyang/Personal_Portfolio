#!/usr/bin/env node
/**
 * One-time local helper: obtains a Spotify refresh token for your own account.
 *
 *   SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... node scripts/spotify-auth.mjs
 *
 * It starts a server on http://127.0.0.1:8888, opens Spotify's consent page,
 * exchanges the returned code and prints the refresh token to this terminal.
 * Nothing is written to disk. Copy the token straight into the GitHub / Cloudflare
 * secret prompts, then clear your terminal scrollback.
 */
import http from "node:http";
import crypto from "node:crypto";
import { exec } from "node:child_process";

const HOST = "127.0.0.1";
const PORT = 8888;
const REDIRECT_URI = `http://${HOST}:${PORT}/callback`;
const SCOPES = ["user-read-currently-playing", "user-read-recently-played", "user-top-read"];

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET.\n" +
      "Run:  SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/spotify-auth.mjs",
  );
  process.exit(1);
}

const state = crypto.randomBytes(16).toString("hex");
const authorizeUrl =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES.join(" "),
    redirect_uri: REDIRECT_URI,
    state,
  });

function openBrowser(url) {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? 'start ""' : "xdg-open";
  exec(`${cmd} "${url}"`, (err) => {
    if (err) console.log("Could not open a browser automatically. Open this URL yourself:\n" + url);
  });
}

function page(res, status, message) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(
    `<!doctype html><meta charset="utf-8"><title>Spotify auth</title>` +
      `<body style="font-family:system-ui;background:#090C19;color:#FFF0BE;display:grid;place-items:center;height:100vh;margin:0">` +
      `<p>${message}</p></body>`,
  );
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", REDIRECT_URI);
  if (url.pathname !== "/callback") {
    page(res, 404, "Not found");
    return;
  }

  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  if (error || !code || url.searchParams.get("state") !== state) {
    page(res, 400, `Authorisation failed: ${error ?? "invalid state or missing code"}`);
    console.error("Authorisation failed:", error ?? "invalid state or missing code");
    server.close();
    process.exitCode = 1;
    return;
  }

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI }),
    });
    const body = await tokenRes.json();
    if (!tokenRes.ok || !body.refresh_token) {
      throw new Error(`${tokenRes.status} ${body.error ?? ""} ${body.error_description ?? ""}`.trim());
    }

    page(res, 200, "Done. Your refresh token is in the terminal. You can close this tab.");
    console.log("\nSPOTIFY_REFRESH_TOKEN (keep this secret, do not commit it):\n");
    console.log(body.refresh_token);
    console.log("\nGranted scopes:", body.scope);
  } catch (err) {
    page(res, 500, "Token exchange failed. See the terminal.");
    console.error("Token exchange failed:", err.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Listening on ${REDIRECT_URI}`);
  console.log("Opening Spotify consent page…");
  openBrowser(authorizeUrl);
});
