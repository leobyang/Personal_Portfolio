/**
 * Movie posters, looked up on Wikipedia at build time (no API key needed).
 * Server-only: called from a Server Component, so the lookup happens during
 * `next build` and the static HTML just contains the image URL.
 *
 * Returns null when nothing is found or the request fails; the UI then shows a
 * typographic placeholder. Set `poster` on a movie in src/data/faves.ts to override.
 */

type WikiPage = { index?: number; thumbnail?: { source: string; width: number; height: number } };

export async function findPoster(title: string, year: number | null): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${title} ${year ?? ""} film`.replace(/\s+/g, " ").trim(),
    gsrlimit: "1",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: "500",
    // Posters are non-free (fair use) images, which pageimages skips by default.
    pilicense: "any",
  });

  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
      headers: { "User-Agent": "portfolio-site-build/1.0" },
      cache: "force-cache",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { query?: { pages?: Record<string, WikiPage> } };
    const page = Object.values(body.query?.pages ?? {})[0];
    const thumb = page?.thumbnail;
    // Posters are portrait; anything else is probably a still or a logo.
    if (!thumb || thumb.height < thumb.width) return null;
    const url = new URL(thumb.source);
    url.search = ""; // drop utm_* tracking params
    return url.toString();
  } catch {
    return null;
  }
}
