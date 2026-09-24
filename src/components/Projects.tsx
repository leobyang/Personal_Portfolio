import Image from "next/image";

export default function Projects() {
  return (
    <section className="py-32 px-8 md:px-24 bg-[#0d1226]" id="projects">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-20">
          <div>
            <h2 className="font-custom uppercase text-4xl md:text-5xl font-bold tracking-tighter text-white">
              Selected Works
            </h2>
            <p className="font-neutraface text-on-surface-variant mt-4 text-white">
              A curated collection of my proudest builds and experiments.
            </p>
          </div>
        </div>
        {/* 3 Columns Grid Layout on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Project 1 */}
          <div className="group relative overflow-hidden rounded-xl glass-card aspect-video lg:aspect-[4/3]">
            <img
              className="w-full h-full object-cover opacity-40 group-hover:scale-105 group-hover:opacity-60 transition-all duration-700"
              alt="Abstract golden financial dashboard"
              src="/assets/Projects/gold_dashboard.png"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
              <span className="font-neutraface text-[10px] tracking-[0.3em] uppercase text-primary-fixed mb-2 block">
                Financial Analytics Platform
              </span>
              <h3 className="font-neutraface text-3xl font-bold text-[#FFF0BE] mb-2">Gold Dashboard</h3>
              <p className="font-neutraface text-on-surface-variant text-base mb-4 hidden sm:line-clamp-3 max-w-md text-white">
                Driver-based attribution engine and AI-assisted scenario analysis converting macroeconomic
                narratives into structured directional signals.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-neutraface uppercase tracking-widest px-3 py-1 bg-surface-container-highest rounded-full border border-outline-variant/30 text-[#FFF0BE]">
                  Python
                </span>
                <span className="text-[10px] font-neutraface uppercase tracking-widest px-3 py-1 bg-surface-container-highest rounded-full border border-outline-variant/30 text-[#FFF0BE]">
                  Pandas
                </span>
                <span className="text-[10px] font-neutraface uppercase tracking-widest px-3 py-1 bg-surface-container-highest rounded-full border border-outline-variant/30 text-[#FFF0BE]">
                  Plotly
                </span>
                <span className="text-[10px] font-neutraface uppercase tracking-widest px-3 py-1 bg-surface-container-highest rounded-full border border-outline-variant/30 text-[#FFF0BE]">
                  Ollama
                </span>
              </div>
            </div>
          </div>
          {/* Project 2 */}
          <div className="group relative overflow-hidden rounded-xl glass-card aspect-video lg:aspect-[4/3]">
            <img
              className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-all duration-700"
              alt="Abstract glowing data network"
              src="/assets/Projects/reddit_stock.png"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
              <span className="font-neutraface text-[10px] tracking-[0.3em] uppercase text-primary-fixed mb-2 block">
                Data Analytics
              </span>
              <h3 className="font-neutraface text-3xl font-bold text-[#FFF0BE] mb-2">Reddit Stock Predictor</h3>
              <p className="font-neutraface text-on-surface-variant text-base mb-4 hidden sm:line-clamp-3 max-w-md text-white">
                Scalable data ingestion pipeline and modular backend processing 115k+ Reddit posts for
                low-latency sentiment and correlation analysis.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-neutraface uppercase tracking-widest px-3 py-1 bg-surface-container-highest rounded-full border border-outline-variant/30 text-[#FFF0BE]">
                  FastAPI
                </span>
                <span className="text-[10px] font-neutraface uppercase tracking-widest px-3 py-1 bg-surface-container-highest rounded-full border border-outline-variant/30 text-[#FFF0BE]">
                  PostgreSQL
                </span>
                <span className="text-[10px] font-neutraface uppercase tracking-widest px-3 py-1 bg-surface-container-highest rounded-full border border-outline-variant/30 text-[#FFF0BE]">
                  React
                </span>
                <span className="text-[10px] font-neutraface uppercase tracking-widest px-3 py-1 bg-surface-container-highest rounded-full border border-outline-variant/30 text-[#FFF0BE]">
                  Node.js
                </span>
              </div>
            </div>
          </div>
          {/* Project 3 */}
          <div className="group relative overflow-hidden rounded-xl glass-card aspect-video lg:aspect-[4/3]">
            <img
              className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-all duration-700"
              alt="Abstract serene glowing wellness stones"
              src="/assets/Projects/harmony_clinic.png"
            />
            <div className="absolute inset-0 bg-[#32267c]/20 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
              <span className="font-neutraface text-[10px] tracking-[0.3em] uppercase text-primary-fixed mb-2 block">
                Website
              </span>
              <h3 className="font-neutraface text-3xl font-bold text-[#FFF0BE] mb-2">Harmony Massage Clinic</h3>
              <p className="font-neutraface text-on-surface-variant text-base mb-4 hidden sm:line-clamp-3 max-w-md text-white">
                Production MERN-based clinic application featuring secure Google Calendar API integration
                and role-aware workflows for 200+ clients.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-neutraface uppercase tracking-widest px-3 py-1 bg-surface-container-highest rounded-full border border-outline-variant/30 text-[#FFF0BE]">
                  MongoDB
                </span>
                <span className="text-[10px] font-neutraface uppercase tracking-widest px-3 py-1 bg-surface-container-highest rounded-full border border-outline-variant/30 text-[#FFF0BE]">
                  Express
                </span>
                <span className="text-[10px] font-neutraface uppercase tracking-widest px-3 py-1 bg-surface-container-highest rounded-full border border-outline-variant/30 text-[#FFF0BE]">
                  React
                </span>
                <span className="text-[10px] font-neutraface uppercase tracking-widest px-3 py-1 bg-surface-container-highest rounded-full border border-outline-variant/30 text-[#FFF0BE]">
                  Google Calendar
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
