import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Aggregated, low-volume "community activity" used on the dashboard hub.
 * All queries are bounded (top-N, recent only) and use existing indexes.
 */

export type CommunityMember = {
  id: string;
  name: string | null;
  email: string;
  headline: string | null;
  image: string | null;
  role: string;
  joinedAt: Date;
};

export type CommunityCohortOpening = {
  cohortId: string;
  cohortName: string;
  cohortSlug: string;
  programTitle: string;
  programSlug: string;
  applicationOpensAt: Date | null;
  applicationClosesAt: Date | null;
};

export type CommunityCourseNew = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  instructorName: string | null;
  publishedSince: Date;
};

export type CommunityUpcomingLab = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  labName: string;
  /** Featured image of the lab when set. */
  labImage: string | null;
  bookerName: string | null;
  /** Only present when the viewer is staff. */
  purpose: string | null;
};

export type CommunityStats = {
  members: number;
  programs: number;
  activeLabs: number;
  publishedCourses: number;
};

export async function getCommunityStats(): Promise<CommunityStats> {
  const [members, programs, activeLabs, publishedCourses] =
    await prisma.$transaction([
      prisma.user.count(),
      prisma.program.count({ where: { published: true } }),
      prisma.lab.count({ where: { status: "ACTIVE" } }),
      prisma.course.count({ where: { published: true } }),
    ]);
  return { members, programs, activeLabs, publishedCourses };
}

export async function getRecentMembers(limit = 6): Promise<CommunityMember[]> {
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      headline: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    headline: r.headline,
    image: r.image,
    role: r.role,
    joinedAt: r.createdAt,
  }));
}

export async function getOpenCohorts(
  limit = 4,
): Promise<CommunityCohortOpening[]> {
  const now = new Date();
  const rows = await prisma.programCohort.findMany({
    where: {
      applicationsOpen: true,
      program: { published: true },
      OR: [
        { applicationClosesAt: null },
        { applicationClosesAt: { gt: now } },
      ],
    },
    orderBy: [{ applicationOpensAt: "asc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      applicationOpensAt: true,
      applicationClosesAt: true,
      program: { select: { title: true, slug: true } },
    },
  });
  return rows.map((c) => ({
    cohortId: c.id,
    cohortName: c.name,
    cohortSlug: c.slug,
    programTitle: c.program.title,
    programSlug: c.program.slug,
    applicationOpensAt: c.applicationOpensAt,
    applicationClosesAt: c.applicationClosesAt,
  }));
}

export async function getRecentCourses(
  limit = 4,
): Promise<CommunityCourseNew[]> {
  const rows = await prisma.course.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      updatedAt: true,
      instructor: { select: { name: true } },
    },
  });
  return rows.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    thumbnail: c.thumbnail,
    instructorName: c.instructor?.name ?? null,
    publishedSince: c.updatedAt,
  }));
}

export async function getUpcomingLabBookings(opts: {
  limit?: number;
  isStaff: boolean;
}): Promise<CommunityUpcomingLab[]> {
  const { limit = 5, isStaff } = opts;
  const now = new Date();
  const rows = await prisma.labBooking.findMany({
    where: {
      status: { in: ["APPROVED", "PENDING"] },
      startTime: { gte: now },
    },
    orderBy: { startTime: "asc" },
    take: limit,
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      purpose: isStaff,
      lab: { select: { name: true, featuredImageUrl: true } },
      user: { select: { name: true } },
    },
  });
  return rows.map((b) => ({
    id: b.id,
    startTime: b.startTime,
    endTime: b.endTime,
    status: b.status,
    labName: b.lab.name,
    labImage: b.lab.featuredImageUrl,
    bookerName: isStaff ? b.user.name : null,
    purpose: isStaff ? b.purpose : null,
  }));
}
