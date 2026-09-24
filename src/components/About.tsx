import Image from "next/image";

export default function About() {
  return (
    <section className="py-32 px-8 md:px-24 bg-[#0d1226]" id="about">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        {/* Left: Photo Collage Placeholder */}
        <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square">
          {/* Base Image Placeholder */}
          <div className="absolute top-0 left-0 w-3/5 h-3/5 glass-card rounded-2xl -rotate-6 flex items-center justify-center border border-[#FFF0BE]/10 shadow-2xl z-10 bg-surface-container-high/80 overflow-hidden group">
            <img
              src="/assets/Collage/775234340.469204_Original.jpg"
              alt="Leo Yang Collage 1"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          </div>
          {/* Right Overlay Placeholder */}
          <div className="absolute top-1/4 right-0 w-2/5 h-2/5 glass-card rounded-2xl rotate-3 flex items-center justify-center border border-[#FFF0BE]/10 shadow-2xl z-20 bg-surface-container-high/90 overflow-hidden group">
            <img
              src="/assets/Collage/IMG_0004.JPG"
              alt="Leo Yang Collage 2"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          </div>
          {/* Bottom Overlay Placeholder */}
          <div className="absolute bottom-0 left-1/4 w-1/2 h-1/2 glass-card rounded-2xl rotate-2 flex items-center justify-center border border-[#FFF0BE]/10 shadow-2xl z-30 bg-surface-container-high overflow-hidden group">
            <img
              src="/assets/Collage/fd5eeca072fb1c3d6dabca584abbf5b1_Original.jpg"
              alt="Leo Yang Collage 3"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          </div>
        </div>

        {/* Right: Text Content */}
        <div className="flex flex-col justify-center">
          <h2 className="font-custom uppercase text-4xl md:text-5xl font-bold tracking-tighter text-white">
            About Me
          </h2>
          <div className="w-24 h-1 bg-primary-fixed mt-4 mb-8"></div>
          <p className="font-neutraface text-lg md:text-xl text-on-surface-variant leading-relaxed text-white">
            I have always loved creating digital systems with a personal impact. Whether that is building
            cool apps or analyzing shifts across the tech industry, I care about making software people
            genuinely enjoy using. (I am also hopelessly convinced that the "perfect" workflow is always
            just one more calendar or to-do list app download away.)
            <br />
            <br />
            I was born in Canada, with family roots in Changsha, Hunan. Most days at home, you will find
            me hanging out with my dog, 得意 (Déyì). Away from the keyboard, I love experimenting with new
            recipes in the kitchen, and my ultimate comfort foods will always be 辣椒炒肉 (là jiāo chǎo ròu) and
            罗宋汤 (luó sòng tāng). On weekends, it is all about catching sports with friends, rooting for
            Ferrari in F1 and watching Luka and the Lakers in the NBA. When it comes to films, my go-to
            favourites are La La Land and (500) Days of Summer, while my daily soundtrack is almost
            exclusively Taylor Swift, G.E.M., and Gracie Abrams.
          </p>

          <div className="mt-16 w-full">
            <h4 className="font-neutraface text-sm uppercase tracking-widest text-center text-[#FFF0BE]/70 mb-8">
              Current Faves
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Book */}
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#180164] flex items-center justify-center border border-white/10">
                  <img
                    src="/assets/Faves/book.svg"
                    alt="Book"
                    className="w-6 h-6 opacity-80"
                    style={{ filter: "invert(1)" }}
                  />
                </div>
                <div className="font-neutraface text-xs">
                  <div className="uppercase text-white font-bold tracking-wider leading-relaxed">
                    A Song to Drown Rivers
                  </div>
                  <div className="text-[#e4dfff]/60">Ann Liang</div>
                </div>
              </div>
              {/* Film */}
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#180164] flex items-center justify-center border border-white/10">
                  <img
                    src="/assets/Faves/film.svg"
                    alt="Film"
                    className="w-6 h-6 opacity-80"
                    style={{ filter: "invert(1)" }}
                  />
                </div>
                <div className="font-neutraface text-xs">
                  <div className="uppercase text-white font-bold tracking-wider leading-relaxed">
                    Voicemails for Isabelle
                  </div>
                </div>
              </div>
              {/* Music */}
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#180164] flex items-center justify-center border border-white/10">
                  <img
                    src="/assets/Faves/music.svg"
                    alt="Music"
                    className="w-6 h-6 opacity-80"
                    style={{ filter: "invert(1)" }}
                  />
                </div>
                <div className="font-neutraface text-xs">
                  <div className="uppercase text-white font-bold tracking-wider leading-relaxed">
                    the cure
                  </div>
                  <div className="text-[#e4dfff]/60">Olivia Rodrigo</div>
                </div>
              </div>
              {/* TV */}
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#180164] flex items-center justify-center border border-white/10">
                  <img
                    src="/assets/Faves/tv.svg"
                    alt="TV"
                    className="w-6 h-6 opacity-80"
                    style={{ filter: "invert(1)" }}
                  />
                </div>
                <div className="font-neutraface text-xs">
                  <div className="uppercase text-white font-bold tracking-wider leading-relaxed">
                    Outer Banks
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
