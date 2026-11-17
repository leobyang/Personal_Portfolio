import Image from "next/image";

/** Album/artist art with a gold music-note placeholder when there's no image. */
export default function AlbumArt({
  src,
  size,
  rounded = "rounded-md",
  className = "",
}: {
  src: string | null;
  size: number;
  rounded?: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        aria-hidden="true"
        className={`shrink-0 grid place-items-center bg-[#151a33] border border-[#FFF0BE]/10 ${rounded} ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 24 24"
          width={Math.round(size * 0.45)}
          height={Math.round(size * 0.45)}
          fill="none"
          stroke="#FFF0BE"
          strokeOpacity={0.6}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={`shrink-0 object-cover ${rounded} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
