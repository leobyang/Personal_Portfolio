export default function Hero() {
  return (
    <section className="min-h-screen flex items-center px-8 md:px-24 py-32 hero-bg-custom relative">
      {/* Fade overlay so the image blends into the left side */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#090C19] via-[#090C19]/40 to-transparent pointer-events-none"></div>
      
      {/* Original Vertical Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090C19]/20 to-[#090C19] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        <div className="lg:col-span-8 lg:pl-16">
          <h1
            id="hero-name"
            className="font-custom uppercase text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[11rem] font-bold tracking-tighter leading-none mb-8 text-white whitespace-nowrap -ml-1 lg:-ml-2"
          >
            LEO YANG
          </h1>
          <p className="font-neutraface text-sm md:text-base lg:text-lg tracking-widest uppercase text-on-surface-variant max-w-2xl leading-relaxed opacity-90 text-white">
            Hi, I'm Leo, an undergraduate student studying Software Engineering and Business at the Ivey School of Business.
          </p>
        </div>
        {/* Profile Picture */}
        <div className="lg:col-span-4 flex justify-center lg:justify-end">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary-fixed to-[#5f2fbd] rounded-[50%] blur-xl opacity-30 group-hover:opacity-100 group-hover:blur-2xl transition-all duration-700"></div>
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-surface-container-high rounded-[50%] overflow-hidden glass-card flex items-center justify-center border border-[#FFF0BE]/20 z-10">
              <img
                src="/assets/files/headshot.jpeg"
                alt="Leo Yang Headshot"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
