import { getPostData, getSortedPostsData } from "@/lib/blog";
import Planetarium from "@/components/Planetarium";
import Link from "next/link";

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
      <Link 
        href="/#blog" 
        className="absolute top-6 right-6 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-[#180164]/40 border border-[#FFF0BE]/20 backdrop-blur-md text-white hover:bg-primary-fixed hover:text-[#090C19] transition-all shadow-xl"
      >
        <span className="material-symbols-outlined text-2xl font-bold">close</span>
      </Link>
      
      <Planetarium post={postData} />
    </main>
  );
}
