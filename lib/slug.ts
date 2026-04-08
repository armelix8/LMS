export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uniqueCourseSlug(
  title: string,
  excludeId?: string,
): Promise<string> {
  const { prisma } = await import("@/lib/prisma");
  const base = slugify(title) || "course";
  let slug = base;
  let n = 0;
  while (true) {
    const existing = await prisma.course.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export async function uniqueProgramSlug(
  title: string,
  excludeId?: string,
): Promise<string> {
  const { prisma } = await import("@/lib/prisma");
  const base = slugify(title) || "program";
  let slug = base;
  let n = 0;
  while (true) {
    const existing = await prisma.program.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export async function uniqueCohortSlug(
  programId: string,
  name: string,
  excludeCohortId?: string,
): Promise<string> {
  const { prisma } = await import("@/lib/prisma");
  const base = slugify(name) || "cohort";
  let slug = base;
  let n = 0;
  while (true) {
    const existing = await prisma.programCohort.findFirst({
      where: {
        programId,
        slug,
        ...(excludeCohortId ? { NOT: { id: excludeCohortId } } : {}),
      },
    });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}
