import { getSortedPostsData } from "@/lib/blog";
import StarrySky from "./StarrySky";

export default async function BlogOverview() {
  const allPosts = getSortedPostsData();

  return (
    <section className="py-32 px-8 md:px-24 bg-[#090C19] relative min-h-screen" id="blog">
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="mb-8">
          <h2 className="font-custom uppercase text-4xl md:text-5xl font-bold tracking-tighter text-white">
            Writings
          </h2>
          <div className="w-24 h-1 bg-primary-fixed mt-4"></div>
          <p className="font-neutraface text-on-surface-variant mt-4 text-white">
            Explore the sky. Each star represents a thought, project, or learning.
          </p>
        </div>
      </div>
      
      {/* Client component that renders the interactive canvas */}
      <div className="absolute inset-0 z-0 pt-64">
        <StarrySky posts={allPosts} />
      </div>
    </section>
  );
}
