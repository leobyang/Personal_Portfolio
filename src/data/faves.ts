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
  /** Poster URL. Leave out to look it up on Wikipedia at build time. */
  poster?: string;
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
  { rank: 3, title: "后来的我们", year: 2018 },
  { rank: 4, title: "The Social Network", year: 2010 },
  { rank: 5, title: "The Perks of being a Wallflower", year: 2012 },
];
