export default function Footer() {
  return (
    <footer className="w-full py-16 px-12 flex flex-col md:flex-row justify-between items-center border-t border-[#FFF0BE]/5 bg-[#090C19]">
      <div className="flex gap-8 items-center">
        <a
          className="group flex flex-col items-center"
          href="https://github.com/leobyang"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/assets/Socials/Github.svg"
            alt="Github"
            className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity"
          />
          <span className="font-neutraface text-[10px] tracking-widest uppercase mt-2 text-[#FFF0BE]/50">
            Github
          </span>
        </a>
        <a
          className="group flex flex-col items-center"
          href="https://www.linkedin.com/in/leobyang"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/assets/Socials/Linkedin.svg"
            alt="LinkedIn"
            className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity"
          />
          <span className="font-neutraface text-[10px] tracking-widest uppercase mt-2 text-[#FFF0BE]/50">
            LinkedIn
          </span>
        </a>
        <a
          className="group flex flex-col items-center"
          href="https://open.spotify.com/user/22bpjqsoomjsikd5dujqcnxpi?si=002ea0ed9ba74362"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/assets/Socials/Spotify.svg"
            alt="Spotify"
            className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity"
          />
          <span className="font-neutraface text-[10px] tracking-widest uppercase mt-2 text-[#FFF0BE]/50">
            Spotify
          </span>
        </a>
      </div>
    </footer>
  );
}
