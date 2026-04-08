type Variant = "card" | "hero" | "list" | "sidebar";

const variantClass: Record<Variant, string> = {
  card: "aspect-[16/10] w-full overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-slate-800",
  hero: "aspect-[21/9] max-h-80 w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800",
  list: "h-14 w-[5.5rem] shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800",
  sidebar:
    "aspect-video w-full max-h-40 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800",
};

/**
 * Featured / cover image for a course (URL stored in `Course.thumbnail`).
 * Renders nothing when `src` is empty.
 */
export function CourseFeaturedImage({
  src,
  alt,
  variant,
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  variant: Variant;
  className?: string;
}) {
  const url = src?.trim();
  if (!url) return null;

  return (
    <div className={`${variantClass[variant]} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary external course art URLs */}
      <img src={url} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}
