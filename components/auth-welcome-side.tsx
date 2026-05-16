import Image from "next/image";

type Highlight = {
  src: string;
  alt: string;
};

const highlights: Highlight[] = [
  { src: "/labs/unipod/rapid-prototyping.jpg", alt: "Rapid prototyping lab" },
  { src: "/labs/unipod/electrical-electronics.jpg", alt: "Electronics lab" },
  { src: "/labs/unipod/audio-visual-studio.jpg", alt: "Audio-visual studio" },
  { src: "/labs/unipod/wood-workshop.jpg", alt: "Wood workshop" },
];

export function AuthWelcomeSide({
  heading,
  body,
}: {
  heading: string;
  body: string;
}) {
  return (
    <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[var(--brand-700)] via-[var(--brand-600)] to-[var(--ur-700)] lg:flex lg:flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(250,204,21,0.18),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(45,212,191,0.25),transparent_45%)]"
      />

      <div className="relative flex flex-1 flex-col justify-between p-10 text-white">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/85">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-400)]"
            />
            UR UniPod community
          </p>
          <h2 className="mt-5 max-w-md text-balance text-3xl font-bold leading-tight">
            {heading}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85">
            {body}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3">
          {highlights.map((h, i) => (
            <div
              key={h.src}
              className={`relative overflow-hidden rounded-xl border border-white/20 shadow-lg ${
                i === 0 || i === 3 ? "aspect-[4/3]" : "aspect-square"
              }`}
            >
              <Image
                src={h.src}
                alt={h.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 0px, 240px"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
              />
              <p className="absolute bottom-2 left-3 text-[10px] font-medium uppercase tracking-wider text-white/95">
                {h.alt}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center gap-3 text-xs text-white/85">
          <span
            aria-hidden
            className="inline-block h-px w-12 bg-white/40"
          />
          <span>
            College of Science and Technology · University of Rwanda
          </span>
        </div>
      </div>
    </aside>
  );
}
