import type { Metadata } from "next";
import { getAdjacentPosts, getPostData, getSortedPostsData } from "@/lib/blog";
import PostPanel from "@/components/planetarium/PostPanel";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  return getSortedPostsData().map((post) => ({ id: post.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = getSortedPostsData().find((p) => p.id === id);
  if (!post) return {};
  return {
    title: `${post.title} · Leo Yang`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: "article" },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params;
  const [post, { prev, next }] = [await getPostData(id), getAdjacentPosts(id)];
  return <PostPanel post={post} prev={prev} next={next} />;
}
