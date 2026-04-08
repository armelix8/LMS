import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export default async function LearnCourseRedirectPage({ params }: Props) {
  const { slug } = await params;

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: { orderBy: { sortOrder: "asc" }, select: { id: true } },
        },
      },
    },
  });

  if (!course) notFound();

  if (!course.published) {
    const session = await auth();
    if (!session?.user?.id) {
      redirect(`/auth/signin?callbackUrl=/learn/${slug}`);
    }
    const isStaff =
      session.user.role === "ADMIN" ||
      session.user.id === course.instructorId;
    if (!isStaff) {
      const en = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: course.id,
          },
        },
      });
      if (en?.status !== "ACTIVE") notFound();
    }
  }

  for (const mod of course.modules) {
    const first = mod.lessons[0];
    if (first) redirect(`/learn/${slug}/${first.id}`);
  }

  return (
    <main className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center">
      <p className="text-slate-600 dark:text-slate-400">
        This course has no lessons yet.
      </p>
    </main>
  );
}
