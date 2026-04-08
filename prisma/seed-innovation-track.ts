import type { PrismaClient } from "@prisma/client";
import { INNOVATION_TRACK_COURSES } from "./innovation-track-courses";

export async function seedInnovationTrackCourses(
  prisma: PrismaClient,
  instructorId: string,
  studentId: string,
): Promise<void> {
  for (const c of INNOVATION_TRACK_COURSES) {
    const existing = await prisma.course.findFirst({ where: { slug: c.slug } });
    if (existing) continue;

    const course = await prisma.course.create({
      data: {
        title: c.title,
        slug: c.slug,
        description: c.description,
        published: true,
        instructorId,
        modules: {
          create: [
            {
              title: c.moduleTitle,
              sortOrder: 0,
              lessons: {
                create: c.lessons.map((l) => ({
                  title: l.title,
                  sortOrder: l.sortOrder,
                  durationMin: l.durationMin,
                  content: l.content,
                  ...(l.assignment
                    ? {
                        assignments: {
                          create: [
                            {
                              sortOrder: 0,
                              title: l.assignment.title,
                              description: l.assignment.description,
                              maxPoints: 100,
                              requiredForCompletion: true,
                              responseType: l.assignment.responseType,
                            },
                          ],
                        },
                      }
                    : {}),
                })),
              },
            },
          ],
        },
      },
    });

    await prisma.enrollment.upsert({
      where: {
        userId_courseId: { userId: studentId, courseId: course.id },
      },
      create: {
        userId: studentId,
        courseId: course.id,
        status: "ACTIVE",
      },
      update: { status: "ACTIVE" },
    });
  }
}
