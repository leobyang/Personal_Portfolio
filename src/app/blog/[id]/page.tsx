import { getPostData, getSortedPostsData } from "@/lib/blog";
import Planetarium from "@/components/Planetarium";

export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    id: post.id,
  }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const postData = await getPostData(p.id);

  return (
    <main className="w-screen h-screen overflow-hidden bg-[#090C19] relative">
      <Planetarium post={postData} />
    </main>
  );
}
