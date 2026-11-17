import { getSortedPostsData } from "@/lib/blog";
import StarrySky from "./StarrySky";

export default async function BlogOverview() {
  const posts = getSortedPostsData().map(({ id, title, date, excerpt, constellation }) => ({
    id,
    title,
    date,
    excerpt,
    constellation,
  }));

  return (
    <section
      className="bg-[#090C19] relative min-h-[80vh] flex flex-col"
      id="blog"
    >
      <StarrySky posts={posts}>
        <div className="max-w-7xl mx-auto w-full">
          <h2 className="font-custom uppercase text-4xl md:text-5xl font-bold tracking-tighter text-white">
            Writings
          </h2>
          <div className="w-24 h-1 bg-primary-fixed mt-4"></div>
          <p className="font-neutraface text-on-surface-variant mt-4 text-white">
            Explore the sky. Each star represents a thought, project, or learning.
          </p>
        </div>
      </StarrySky>
    </section>
  );
}
