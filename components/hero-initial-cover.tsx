import Image from "next/image";

/** Large hero: optional cover image, otherwise gradient + initial (courses, programs, cohorts). */
export function HeroInitialCover({
  title,
  imageUrl,
  className = "",
}: {
  title: string;
  /** Site-relative URL (e.g. `/images/programs/…`) or absolute https. */
  imageUrl?: string | null;
  className?: string;
}) {
  const initial = title.trim().slice(0, 1).toUpperCase() || "?";

  if (imageUrl) {
    return (
      <div
        className={`relative aspect-[21/9] max-h-[22rem] min-h-[12rem] w-full overflow-hidden rounded-[1.75rem] shadow-inner ring-1 ring-teal-900/10 dark:ring-teal-500/20 ${className}`}
      >
        <Image
          src={imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1280px) 100vw, 1280px"
          priority
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex aspect-[21/9] max-h-[22rem] min-h-[12rem] w-full items-center justify-center overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-teal-600 via-sky-600 to-indigo-700 shadow-inner ring-1 ring-white/10 ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
      <span className="relative text-6xl font-black tracking-tight text-white/90 drop-shadow-sm sm:text-7xl">
        {initial}
      </span>
    </div>
  );
}
