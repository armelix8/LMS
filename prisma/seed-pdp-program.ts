import type { PrismaClient } from "@prisma/client";
import {
  PDP_COVER_IMAGE_URL,
  PDP_DESCRIPTION,
  PDP_PHASES,
  PDP_SLUG,
  PDP_TITLE,
} from "./pdp-program-data";

/**
 * Creates the Prototype Development Program with three monthly phases,
 * linked innovation-track courses (when those courses exist), and
 * program-level assignments. Idempotent: skips if slug already exists.
 */
export async function seedPDPProgram(prisma: PrismaClient): Promise<void> {
  const existing = await prisma.program.findUnique({
    where: { slug: PDP_SLUG },
    select: { id: true },
  });
  if (existing) {
    console.log("[seed] PDP program already exists — skipping.");
    return;
  }

  const allSlugs = [...new Set(PDP_PHASES.flatMap((p) => p.courseSlugs))];
  const courseRows =
    allSlugs.length > 0
      ? await prisma.course.findMany({
          where: { slug: { in: allSlugs } },
          select: { id: true, slug: true },
        })
      : [];
  const idBySlug = new Map(courseRows.map((c) => [c.slug, c.id]));

  for (const slug of allSlugs) {
    if (!idBySlug.has(slug)) {
      console.warn(
        `[seed] PDP: course slug not found (link later in admin): ${slug}`,
      );
    }
  }

  await prisma.program.create({
    data: {
      title: PDP_TITLE,
      slug: PDP_SLUG,
      description: PDP_DESCRIPTION,
      published: true,
      coverImageUrl: PDP_COVER_IMAGE_URL,
      phases: {
        create: PDP_PHASES.map((p) => ({
          sortOrder: p.sortOrder,
          title: p.title,
          description: p.description,
          phaseCourses: {
            create: p.courseSlugs
              .map((slug, i) => {
                const courseId = idBySlug.get(slug);
                return courseId ? { courseId, sortOrder: i } : null;
              })
              .filter(
                (row): row is { courseId: string; sortOrder: number } =>
                  row !== null,
              ),
          },
          assignments: {
            create: p.assignments.map((a, i) => ({
              title: a.title,
              description: a.description,
              maxPoints: a.maxPoints,
              sortOrder: i,
              requiredForCompletion: a.requiredForCompletion,
              responseType: a.responseType,
            })),
          },
        })),
      },
    },
  });

  console.log("[seed] Created Prototype Development Program (PDP).");
}
