import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { MemberAvatar } from "@/components/member-avatar";
import {
  getCommunityStats,
  getOpenCohorts,
  getRecentCourses,
  getRecentMembers,
  getUpcomingLabBookings,
} from "@/lib/community-feed";
import { prisma } from "@/lib/prisma";
import { isCohortFinishedForUser } from "@/lib/program-progress";
import { getUserProfileSnapshot } from "@/lib/user-display";

export const metadata = { title: "Community" };

function roleLabel(role: string) {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "INSTRUCTOR":
      return "Instructor";
    case "LAB_TECHNICIAN":
      return "Lab Technician";
    default:
      return "Innovator";
  }
}

function relativeTime(d: Date) {
  const diff = Date.now() - d.getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

function formatDateRange(start: Date, end: Date) {
  const sameDay = start.toDateString() === end.toDateString();
  const dateFmt = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeFmt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (sameDay) {
    return `${dateFmt.format(start)} · ${timeFmt.format(start)}–${timeFmt.format(end)}`;
  }
  return `${dateFmt.format(start)} ${timeFmt.format(start)} → ${dateFmt.format(end)} ${timeFmt.format(end)}`;
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function QuickCard({
  href,
  title,
  description,
  icon,
  accent,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: "brand" | "accent" | "ur" | "violet";
}) {
  const accentClass = {
    brand:
      "from-[var(--brand-500)]/15 to-[var(--brand-500)]/0 text-[var(--brand-700)] dark:text-[var(--brand-300)]",
    accent:
      "from-[var(--accent-400)]/25 to-[var(--accent-400)]/0 text-[var(--accent-600)]",
    ur: "from-[var(--ur-500)]/15 to-[var(--ur-500)]/0 text-[var(--ur-700)] dark:text-[var(--ur-300)]",
    violet:
      "from-violet-500/15 to-violet-500/0 text-violet-700 dark:text-violet-300",
  }[accent];

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--brand-500)]/40 hover:shadow-md"
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentClass}`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] shadow-sm`}>
          {icon}
        </div>
        <span
          aria-hidden
          className="text-[var(--muted-foreground)] transition group-hover:translate-x-0.5 group-hover:text-[var(--brand-700)]"
        >
          →
        </span>
      </div>
      <h3 className="relative mt-4 text-sm font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="relative mt-1 text-xs text-[var(--muted-foreground)]">
        {description}
      </p>
    </Link>
  );
}

function SectionTitle({
  children,
  href,
  hrefLabel,
}: {
  children: React.ReactNode;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
        {children}
      </h2>
      {href ? (
        <Link
          href={href}
          className="text-xs font-medium text-[var(--brand-700)] underline-offset-4 hover:underline dark:text-[var(--brand-300)]"
        >
          {hrefLabel ?? "View all"} →
        </Link>
      ) : null}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;
  const role = session.user.role ?? "STUDENT";
  const isStaff =
    role === "ADMIN" || role === "INSTRUCTOR" || role === "LAB_TECHNICIAN";

  const [
    profile,
    stats,
    members,
    openCohorts,
    recentCourses,
    upcomingBookings,
    enrollments,
    cohortRows,
    progressCounts,
    myUpcomingBookings,
  ] = await Promise.all([
    getUserProfileSnapshot(userId),
    getCommunityStats(),
    getRecentMembers(6),
    getOpenCohorts(3),
    getRecentCourses(4),
    getUpcomingLabBookings({ limit: 5, isStaff }),
    prisma.enrollment.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        course: {
          include: {
            modules: { include: { lessons: { select: { id: true } } } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
      take: 6,
    }),
    prisma.cohortMember.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        cohort: {
          include: { program: { select: { title: true, slug: true } } },
        },
      },
      orderBy: { appliedAt: "desc" },
      take: 4,
    }),
    prisma.lessonProgress.groupBy({
      by: ["lessonId"],
      where: { userId },
      _count: true,
    }),
    prisma.labBooking.findMany({
      where: {
        userId,
        startTime: { gte: new Date() },
        status: { in: ["APPROVED", "PENDING"] },
      },
      orderBy: { startTime: "asc" },
      take: 3,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        lab: { select: { name: true } },
      },
    }),
  ]);

  const completedSet = new Set(progressCounts.map((p) => p.lessonId));
  const cohortFinished = await Promise.all(
    cohortRows.map(async (m) => ({
      memberId: m.id,
      finished: await isCohortFinishedForUser(userId, m.cohort.programId),
    })),
  );
  const finishedByMemberId = new Map(
    cohortFinished.map((x) => [x.memberId, x.finished]),
  );

  const displayName = profile.name ?? session.user.name ?? "";
  const firstName = displayName.split(" ")[0] || "there";

  return (
    <main className="flex-1">
      {/* Welcome banner */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-[var(--brand-50)] via-[var(--surface)] to-[var(--surface-muted)] dark:from-[var(--brand-950)] dark:via-[var(--surface)] dark:to-[var(--surface)]"
        />
        <div
          aria-hidden
          className="absolute -right-32 top-0 h-72 w-72 rounded-full bg-[var(--accent-400)]/15 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-[var(--ur-500)]/15 blur-3xl"
        />

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-700)] dark:text-[var(--brand-300)]">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-400)]"
            />
            UR UniPod community
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Welcome back, {firstName}
          </h1>
          {profile.headline ? (
            <p className="mt-2 max-w-2xl text-sm font-medium text-[var(--muted-foreground)]">
              {profile.headline} · {roleLabel(role)}
            </p>
          ) : (
            <p className="mt-2 max-w-2xl text-sm font-medium text-[var(--muted-foreground)]">
              {roleLabel(role)} · University of Rwanda
            </p>
          )}

          {/* Stats strip */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Members", value: stats.members },
              { label: "Programs", value: stats.programs },
              { label: "Active labs", value: stats.activeLabs },
              { label: "Published courses", value: stats.publishedCourses },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 px-4 py-3 backdrop-blur-sm"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                  {s.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {s.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Staff toolbar (admins, instructors, lab techs) */}
          {isStaff ? (
            <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--brand-500)]/20 bg-[var(--surface)]/70 px-4 py-3 backdrop-blur-sm">
              <p className="mr-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--brand-700)] dark:text-[var(--brand-300)]">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-400)]"
                />
                Staff tools
              </p>
              {role === "ADMIN" ? (
                <>
                  <Link
                    href="/admin/programs"
                    className="inline-flex items-center gap-1.5 rounded-md bg-[var(--brand-500)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--brand-600)]"
                  >
                    ⚙ Manage programs
                  </Link>
                  <Link
                    href="/admin/programs/new"
                    className="inline-flex items-center rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[var(--brand-500)]/40 dark:text-slate-200"
                  >
                    + New program
                  </Link>
                </>
              ) : null}
              {role === "ADMIN" || role === "INSTRUCTOR" ? (
                <Link
                  href="/instructor"
                  className="inline-flex items-center rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[var(--brand-500)]/40 dark:text-slate-200"
                >
                  Instructor console
                </Link>
              ) : null}
              {role === "ADMIN" || role === "INSTRUCTOR" ? (
                <Link
                  href="/labs/bookings"
                  className="inline-flex items-center rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[var(--brand-500)]/40 dark:text-slate-200"
                >
                  Booking calendar
                </Link>
              ) : null}
              {role === "ADMIN" || role === "LAB_TECHNICIAN" ? (
                <Link
                  href="/labs/maintenance"
                  className="inline-flex items-center rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[var(--brand-500)]/40 dark:text-slate-200"
                >
                  Maintenance
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {/* Quick actions */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickCard
            href="/programs"
            title="Programs"
            description="Apply to cohort-based innovation tracks"
            accent="brand"
            icon={
              <svg className="h-5 w-5 text-[var(--brand-700)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9-4 9 4-9 4-9-4zM3 12l9 4 9-4M3 17l9 4 9-4" />
              </svg>
            }
          />
          <QuickCard
            href="/courses"
            title="Courses"
            description="Self-paced learning across topics"
            accent="ur"
            icon={
              <svg className="h-5 w-5 text-[var(--ur-700)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V6a1 1 0 011-1h6v15H5a1 1 0 01-1-1zM13 5h6a1 1 0 011 1v13a1 1 0 01-1 1h-6V5z" />
              </svg>
            }
          />
          <QuickCard
            href="/labs"
            title="Labs & spaces"
            description="Discover and book UNIPOD makerspaces"
            accent="accent"
            icon={
              <svg className="h-5 w-5 text-[var(--accent-600)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v6l-5 9a2 2 0 001.74 3h12.52A2 2 0 0020 18l-5-9V3M9 3h6" />
              </svg>
            }
          />
          <QuickCard
            href="/profile"
            title="My profile"
            description="Update your headline, photo, and bio"
            accent="violet"
            icon={
              <svg className="h-5 w-5 text-violet-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 14a4 4 0 10-8 0M12 11a3 3 0 110-6 3 3 0 010 6zM4 21a8 8 0 0116 0" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Main two-column area */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:grid lg:grid-cols-[2fr_1fr] lg:gap-8 lg:px-8">
        {/* LEFT: Community feed */}
        <div className="space-y-10">
          {/* New members */}
          {members.length > 0 && (
            <div>
              <SectionTitle>New members</SectionTitle>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--brand-500)]/40"
                  >
                    <MemberAvatar
                      name={m.name}
                      email={m.email}
                      image={m.image}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {m.name ?? m.email.split("@")[0]}
                      </p>
                      <p className="truncate text-xs text-[var(--muted-foreground)]">
                        {m.headline ?? roleLabel(m.role)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                      {relativeTime(m.joinedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Open program cohorts */}
          {openCohorts.length > 0 && (
            <div>
              <SectionTitle href="/programs" hrefLabel="All programs">
                Apply to a program
              </SectionTitle>
              <ul className="mt-4 space-y-3">
                {openCohorts.map((c) => (
                  <li
                    key={c.cohortId}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--brand-500)]/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-700)] dark:text-[var(--brand-300)]">
                          {c.programTitle}
                        </p>
                        <Link
                          href={`/programs/${c.programSlug}/cohorts/${c.cohortSlug}`}
                          className="mt-1 block text-base font-semibold text-slate-900 hover:text-[var(--brand-700)] dark:text-white dark:hover:text-[var(--brand-300)]"
                        >
                          {c.cohortName}
                        </Link>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          {c.applicationOpensAt
                            ? `Applications open ${formatDate(c.applicationOpensAt)}`
                            : "Applications open"}
                          {c.applicationClosesAt
                            ? ` · closes ${formatDate(c.applicationClosesAt)}`
                            : ""}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-400)]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-600)]">
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full bg-[var(--accent-400)]"
                        />
                        Now accepting
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recent courses */}
          {recentCourses.length > 0 && (
            <div>
              <SectionTitle href="/courses" hrefLabel="Catalog">
                Recently published courses
              </SectionTitle>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {recentCourses.map((c) => (
                  <li
                    key={c.id}
                    className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition hover:border-[var(--brand-500)]/40"
                  >
                    <Link href={`/courses/${c.slug}`} className="block">
                      <div className="relative h-28 w-full bg-[var(--surface-subtle)]">
                        {c.thumbnail ? (
                          <Image
                            src={c.thumbnail}
                            alt={c.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 33vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-3xl">
                            📚
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">
                          {c.title}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          {c.instructorName
                            ? `by ${c.instructorName} · `
                            : ""}
                          {relativeTime(c.publishedSince)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upcoming bookings (community-wide) */}
          {upcomingBookings.length > 0 && (
            <div>
              <SectionTitle href="/labs/bookings" hrefLabel="Calendar">
                Upcoming in the labs
              </SectionTitle>
              <ul className="mt-4 space-y-3">
                {upcomingBookings.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--brand-500)]/40"
                  >
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-subtle)]">
                      {b.labImage ? (
                        <Image
                          src={b.labImage}
                          alt={b.labName}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xl">
                          🧪
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {b.labName}
                      </p>
                      <p className="truncate text-xs text-[var(--muted-foreground)]">
                        {formatDateRange(b.startTime, b.endTime)}
                      </p>
                      {isStaff && b.bookerName ? (
                        <p className="truncate text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                          Reserved by {b.bookerName}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                        b.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {b.status.toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT: Personal sidebar */}
        <aside className="mt-10 space-y-8 lg:mt-0">
          {/* My courses */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <SectionTitle
              href={enrollments.length > 0 ? "/courses" : undefined}
              hrefLabel="Browse more"
            >
              My courses
            </SectionTitle>
            {enrollments.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                You haven&apos;t enrolled yet.{" "}
                <Link
                  href="/courses"
                  className="font-medium text-[var(--brand-700)] hover:underline dark:text-[var(--brand-300)]"
                >
                  Browse the catalog →
                </Link>
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {enrollments.map(({ course }) => {
                  const total = course.modules.reduce(
                    (n, m) => n + m.lessons.length,
                    0,
                  );
                  const done = course.modules.reduce(
                    (n, m) =>
                      n + m.lessons.filter((l) => completedSet.has(l.id)).length,
                    0,
                  );
                  const pct =
                    total === 0 ? 0 : Math.round((done / total) * 100);
                  return (
                    <li key={course.id}>
                      <Link
                        href={`/learn/${course.slug}`}
                        className="block rounded-lg p-2 transition hover:bg-[var(--surface-muted)]"
                      >
                        <p className="line-clamp-1 text-sm font-medium text-slate-900 dark:text-white">
                          {course.title}
                        </p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-subtle)]">
                          <div
                            className="h-full rounded-full bg-[var(--brand-500)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                          {done} / {total} lessons · {pct}%
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* My cohorts */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <SectionTitle
              href={cohortRows.length > 0 ? "/programs" : undefined}
              hrefLabel="Explore"
            >
              My cohorts
            </SectionTitle>
            {cohortRows.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                You&apos;re not in any cohort yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {cohortRows.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/programs/${m.cohort.program.slug}/cohorts/${m.cohort.slug}`}
                      className="block rounded-lg p-2 transition hover:bg-[var(--surface-muted)]"
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--brand-700)] dark:text-[var(--brand-300)]">
                        {m.cohort.program.title}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                        {m.cohort.name}
                      </p>
                      {finishedByMemberId.get(m.id) ? (
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                          Cohort complete ✓
                        </p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* My upcoming bookings */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <SectionTitle href="/labs/bookings" hrefLabel="Reserve">
              My bookings
            </SectionTitle>
            {myUpcomingBookings.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                No upcoming bookings.{" "}
                <Link
                  href="/labs"
                  className="font-medium text-[var(--brand-700)] hover:underline dark:text-[var(--brand-300)]"
                >
                  Find a lab →
                </Link>
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {myUpcomingBookings.map((b) => (
                  <li
                    key={b.id}
                    className="rounded-lg border border-[var(--border)] p-3"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {b.lab.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      {formatDateRange(b.startTime, b.endTime)}
                    </p>
                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        b.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {b.status.toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Out-link to main site */}
          <a
            href="https://unipod.ur.ac.rw"
            target="_blank"
            rel="noreferrer"
            className="block rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] p-5 text-sm text-[var(--muted-foreground)] transition hover:border-[var(--brand-500)]/50 hover:text-slate-900 dark:hover:text-white"
          >
            <p className="font-semibold text-slate-900 dark:text-white">
              Visit unipod.ur.ac.rw
            </p>
            <p className="mt-1 text-xs">
              News, success stories, and public information about UR UniPod →
            </p>
          </a>
        </aside>
      </section>
    </main>
  );
}
