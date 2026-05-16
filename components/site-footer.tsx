import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

type FooterLink = { href: string; label: string; external?: boolean };

const platformLinks: FooterLink[] = [
  { href: "/programs", label: "Programs" },
  { href: "/courses", label: "Courses" },
  { href: "/labs", label: "Labs & spaces" },
  { href: "/dashboard", label: "Dashboard" },
];

const communityLinks: FooterLink[] = [
  { href: "https://unipod.ur.ac.rw", label: "About UR UniPod", external: true },
  {
    href: "https://unipod.ur.ac.rw/destination-list/",
    label: "Labs & workshops",
    external: true,
  },
  { href: "https://ur.ac.rw", label: "University of Rwanda", external: true },
];

const accountLinks: FooterLink[] = [
  { href: "/auth/signin", label: "Sign in" },
  { href: "/auth/signup", label: "Create account" },
  { href: "/profile", label: "Profile" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-900 dark:text-white">
        {title}
      </h3>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map((link) =>
          link.external ? (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--muted-foreground)] transition hover:text-[var(--brand-700)] dark:hover:text-[var(--brand-300)]"
              >
                {link.label}
              </a>
            </li>
          ) : (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-[var(--muted-foreground)] transition hover:text-[var(--brand-700)] dark:hover:text-[var(--brand-300)]"
              >
                {link.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface-muted)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <BrandLogo href="/" size="md" />
          <p className="max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
            UR UniPod is the University of Rwanda&apos;s innovation community —
            bringing together programs, courses, makerspaces, and people to
            turn ideas into prototypes.
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            College of Science and Technology · University of Rwanda · Kigali,
            Rwanda
          </p>
        </div>

        <FooterColumn title="Platform" links={platformLinks} />
        <FooterColumn title="Community" links={communityLinks} />
        <FooterColumn title="Account" links={accountLinks} />
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-5 text-xs text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p>
            © {year} University of Rwanda · UR UniPod. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://unipod.ur.ac.rw"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--brand-700)] dark:hover:text-[var(--brand-300)]"
            >
              unipod.ur.ac.rw ↗
            </a>
            <span aria-hidden className="text-[var(--border-strong)]">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-400)]"
              />
              Creativity starts here
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
