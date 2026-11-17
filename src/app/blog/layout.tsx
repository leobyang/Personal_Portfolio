import Planetarium from "@/components/Planetarium";

/**
 * Shared by every /blog/<id> page. The dome lives here (not in the page) so it keeps
 * turning instead of being torn down when moving from one post to the next.
 */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="fixed inset-0 overflow-hidden bg-[#090C19]">
      <Planetarium />
      {children}
    </main>
  );
}
