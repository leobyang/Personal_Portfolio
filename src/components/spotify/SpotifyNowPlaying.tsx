import NowPlayingCard from "./NowPlayingCard";
import { getSpotifyData, type NowPlaying } from "./data";

/**
 * Server wrapper: reads the build-time "last played" snapshot and hands it to the
 * client card, which then polls the now-playing Worker.
 */
export default function SpotifyNowPlaying() {
  const { lastPlayed } = getSpotifyData();
  const initial: NowPlaying | null = lastPlayed ? { ...lastPlayed, isPlaying: false } : null;
  return <NowPlayingCard initial={initial} endpoint={process.env.NEXT_PUBLIC_NOW_PLAYING_URL ?? ""} />;
}
