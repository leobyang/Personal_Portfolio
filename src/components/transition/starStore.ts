/**
 * Channel between the sky (homepage), the post panel and the <StarTransition />
 * overlay in the root layout. The root layout persists across client-side
 * navigation, so the overlay can carry a star from one page to the other.
 */

export type StarOverlay = {
  /** Star flares at (x, y), the page dims, the star drifts to the centre. Resolves once the page is hidden. */
  open: (x: number, y: number) => Promise<void>;
  /** The post panel has mounted: hand the star over to the panel's opening animation. */
  arrivePost: () => void;
  /** Post is collapsing into a star: dim the page, then (after navigation) fly the star home to `postId`. */
  close: (postId: string) => Promise<void>;
};

let overlay: StarOverlay | null = null;
let opening = false;

export function registerStarOverlay(api: StarOverlay) {
  overlay = api;
  return () => {
    if (overlay === api) overlay = null;
  };
}

export const hasStarOverlay = () => overlay !== null;

export function playOpen(x: number, y: number) {
  opening = true;
  return overlay ? overlay.open(x, y) : Promise.resolve();
}

/** Read (don't consume) so StrictMode's double render sees the same value. */
export const peekOpening = () => opening;

export function arrivedAtPost() {
  if (!opening) return;
  opening = false;
  overlay?.arrivePost();
}

export function playClose(postId: string) {
  return overlay ? overlay.close(postId) : Promise.resolve();
}

/** Selector for a post's star in the sky (set on the star links in StarrySky). */
export const starSelector = (postId: string) => `[data-post-star="${CSS.escape(postId)}"]`;
