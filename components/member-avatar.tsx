import Image from "next/image";

type Props = {
  name: string | null;
  email?: string | null;
  image?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const SIZE: Record<NonNullable<Props["size"]>, { px: number; cls: string }> = {
  xs: { px: 24, cls: "h-6 w-6 text-[10px]" },
  sm: { px: 32, cls: "h-8 w-8 text-xs" },
  md: { px: 40, cls: "h-10 w-10 text-sm" },
  lg: { px: 56, cls: "h-14 w-14 text-base" },
};

function initialsFor(name: string | null, email?: string | null) {
  const src = (name ?? email ?? "").trim();
  if (!src) return "?";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return src.slice(0, 2).toUpperCase();
}

export function MemberAvatar({
  name,
  email,
  image,
  size = "md",
  className = "",
}: Props) {
  const { px, cls } = SIZE[size];

  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? email ?? "Member"}
        width={px}
        height={px}
        className={`${cls} shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm dark:ring-slate-900 ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`${cls} inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-500)] to-[var(--ur-700)] font-semibold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 ${className}`}
    >
      {initialsFor(name, email)}
    </span>
  );
}
