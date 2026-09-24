export default function Experience() {
  return (
    <section className="py-32 px-8 md:px-24 bg-[#090C19]" id="experience">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-20">
          <h2 className="font-custom uppercase text-4xl md:text-5xl font-bold tracking-tighter text-white">
            Experience
          </h2>
          <div className="w-24 h-1 bg-primary-fixed mt-4"></div>
        </div>
        <div className="grid grid-cols-1 gap-12 max-w-5xl">
          {/* Role 1 */}
          <div className="group relative flex flex-col md:flex-row gap-8 md:gap-16 items-start">
            <div className="md:w-1/4 font-neutraface text-primary-fixed opacity-60 pt-2 tracking-widest uppercase text-xs">
              Summer 2026
            </div>
            <div className="md:w-3/4">
              <h3 className="font-neutraface uppercase text-white text-2xl font-bold transition-colors">
                Project Operations and Automation Intern
              </h3>
              <p className="font-neutraface text-on-secondary-container mb-0 tracking-tight">
                3MA Consulting Inc.
              </p>
            </div>
          </div>
          {/* Role 2 */}
          <div className="group relative flex flex-col md:flex-row gap-8 md:gap-16 items-start">
            <div className="md:w-1/4 font-neutraface text-primary-fixed opacity-60 pt-2 tracking-widest uppercase text-xs">
              Summer 2025
            </div>
            <div className="md:w-3/4">
              <h3 className="font-neutraface uppercase text-white text-2xl font-bold transition-colors">
                Business Analyst Intern
              </h3>
              <p className="font-neutraface text-on-secondary-container mb-0 tracking-tight">
                Barcoded Fit Tech Inc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
