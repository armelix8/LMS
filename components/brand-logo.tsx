import Image from "next/image";
import Link from "next/link";

type Props = {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  taglineText?: string;
  className?: string;
  onClick?: () => void;
};

const SIZE_MAP: Record<NonNullable<Props["size"]>, { h: string; w: number }> = {
  sm: { h: "h-8", w: 160 },
  md: { h: "h-10", w: 200 },
  lg: { h: "h-12", w: 240 },
};

export function BrandLogo({
  href = "/",
  size = "md",
  showTagline = false,
  taglineText = "Creativity starts here",
  className = "",
  onClick,
}: Props) {
  const { h, w } = SIZE_MAP[size];

  const inner = (
    <span className="group flex min-w-0 shrink items-center gap-3">
      <Image
        src="/brand/unipod-logo.png"
        alt="UR UniPod — University of Rwanda"
        width={w}
        height={Math.round((w * 155) / 592)}
        className={`${h} w-auto object-contain object-left`}
        priority
      />
      {showTagline ? (
        <span className="hidden min-w-0 flex-col border-l border-[var(--border)] pl-3 leading-tight sm:flex">
          <span className="text-xs font-semibold text-slate-900 dark:text-white">
            UR UniPod
          </span>
          <span className="text-[10px] font-medium text-[var(--muted-foreground)]">
            {taglineText}
          </span>
        </span>
      ) : null}
    </span>
  );

  if (!href) return <span className={className}>{inner}</span>;

  return (
    <Link href={href} className={className} onClick={onClick}>
      {inner}
    </Link>
  );
}
