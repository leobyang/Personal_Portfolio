import { getSpotifyData } from "./data";

/** "Updated daily from Spotify · Nov 16, 2026" (or a sample-data note in local dev/forks). */
export default function SpotifyUpdatedCaption({ className = "" }: { className?: string }) {
  const { fetchedAt, source } = getSpotifyData();
  const date = new Date(fetchedAt);
  const formatted = Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

  return (
    <p className={`font-neutraface text-xs text-[#e4dfff]/50 ${className}`}>
      {source === "sample" ? "Sample data · " : "Updated daily from Spotify"}
      {source === "sample" ? "connect Spotify to show real listening" : null}
      {source !== "sample" && formatted ? (
        <>
          {" · "}
          <time dateTime={fetchedAt}>{formatted}</time>
        </>
      ) : null}
    </p>
  );
}
