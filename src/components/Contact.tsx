export default function Contact() {
  return (
    <section className="py-32 px-8 md:px-24 bg-[#090C19]" id="contact">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-custom uppercase text-5xl md:text-7xl font-bold tracking-tighter text-white mb-12 opacity-100">
          Let's connect!
        </h2>
        <a
          className="inline-block bg-[#FFF0BE] text-[#38300e] font-neutraface font-bold px-12 py-6 rounded-full text-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#FFF0BE]/10 hover:shadow-[#FFF0BE]/30 brightness-110"
          href="mailto:yangleo2005@gmail.com"
        >
          Email me!
        </a>
      </div>
    </section>
  );
}
