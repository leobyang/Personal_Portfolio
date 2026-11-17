export type FaveKind = "book" | "film" | "music" | "tv";

export type CurrentFave = {
  kind: FaveKind;
  /** Visible label for the category, e.g. "Reading". */
  label: string;
  title: string;
  /** Author / artist, when relevant. */
  creator?: string;
};

export type TopMovie = {
  rank: 1 | 2 | 3 | 4 | 5;
  title: string;
  year: number | null;
  note?: string;
};

export const currentFaves: CurrentFave[] = [
  { kind: "book", label: "Book", title: "The Love Hypothesis", creator: "Ali Hazelwood" },
  { kind: "film", label: "Film", title: "后来的我们" },
  { kind: "music", label: "Music", title: "Stop The Wedding!", creator: "Ashe" },
  { kind: "tv", label: "TV", title: "Crew Girl" },
];

export const topMovies: TopMovie[] = [
  { rank: 1, title: "La La Land", year: 2016 },
  { rank: 2, title: "(500) Days of Summer", year: 2009 },
  // TODO(Leo): fill in #3–#5. Entries with title "TODO" are hidden on the site.
  { rank: 3, title: "TODO", year: null },
  { rank: 4, title: "TODO", year: null },
  { rank: 5, title: "TODO", year: null },
];
