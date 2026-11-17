import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const postsDirectory = path.join(process.cwd(), "content/blog");

const WORDS_PER_MINUTE = 220;

export type BlogPost = {
  id: string;
  title: string;
  /** ISO date string (YYYY-MM-DD) as written in frontmatter. */
  date: string;
  excerpt?: string;
  /** Constellation the post belongs to. Defaults to the post's year, e.g. "2026". */
  constellation: string;
  tags: string[];
  readingMinutes: number;
  contentHtml?: string;
};

export type AdjacentPost = { id: string; title: string } | null;

type Frontmatter = {
  title?: string;
  date?: string | Date;
  excerpt?: string;
  constellation?: string;
  tags?: string[] | string;
};

function normaliseDate(value: Frontmatter["date"]): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value ? String(value) : "";
}

function toTime(date: string): number {
  const t = new Date(date).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function countWords(markdown: string): number {
  const words = markdown
    // drop code fences' markers, markdown punctuation and URLs so they don't inflate the count
    .replace(/```/g, " ")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/[#>*_`~\-[\]|]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.length;
}

function readPost(id: string): { post: BlogPost; content: string } {
  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const fm = data as Frontmatter;

  const date = normaliseDate(fm.date);
  const year = date ? String(new Date(date).getUTCFullYear()) : "Uncharted";
  const tags = Array.isArray(fm.tags)
    ? fm.tags.map(String)
    : typeof fm.tags === "string"
      ? fm.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

  return {
    content,
    post: {
      id,
      title: fm.title ?? id,
      date,
      excerpt: fm.excerpt,
      constellation: fm.constellation?.trim() || year,
      tags,
      readingMinutes: Math.max(1, Math.ceil(countWords(content) / WORDS_PER_MINUTE)),
    },
  };
}

function getPostIds(): string[] {
  if (!fs.existsSync(postsDirectory)) return [];
  return fs
    .readdirSync(postsDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => fileName.replace(/\.md$/, ""));
}

/** All posts, newest first. */
export function getSortedPostsData(): BlogPost[] {
  return getPostIds()
    .map((id) => readPost(id).post)
    .sort((a, b) => toTime(b.date) - toTime(a.date) || a.id.localeCompare(b.id));
}

/** Previous (older) and next (newer) posts in chronological order. */
export function getAdjacentPosts(id: string): { prev: AdjacentPost; next: AdjacentPost } {
  const chronological = [...getSortedPostsData()].reverse();
  const index = chronological.findIndex((p) => p.id === id);
  if (index === -1) return { prev: null, next: null };
  const pick = (p?: BlogPost): AdjacentPost => (p ? { id: p.id, title: p.title } : null);
  return { prev: pick(chronological[index - 1]), next: pick(chronological[index + 1]) };
}

export async function getPostData(id: string): Promise<BlogPost> {
  const { post, content } = readPost(id);
  const processedContent = await remark().use(html).process(content);
  return { ...post, contentHtml: processedContent.toString() };
}
