import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonAssessmentEditor } from "@/components/lesson-assessment-editor";
import { LessonEditForm } from "@/components/lesson-edit-form";
import { updateLesson } from "@/app/actions/lms";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string; lessonId: string }> };

export default async function EditLessonPage({ params }: Props) {
  const { id: courseId, lessonId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { include: { course: true } },
      quiz: {
        include: {
          questions: {
            orderBy: { sortOrder: "asc" },
            include: { options: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
      assignments: {
        orderBy: { sortOrder: "asc" },
        include: {
          submissions: {
            orderBy: { submittedAt: "desc" },
            include: { user: { select: { name: true, email: true } } },
          },
        },
      },
    },
  });

  if (!lesson || lesson.module.courseId !== courseId) notFound();
  const course = lesson.module.course;
  if (
    session.user.role !== "ADMIN" &&
    course.instructorId !== session.user.id
  ) {
    notFound();
  }

  async function saveLesson(formData: FormData) {
    "use server";
    await updateLesson(lessonId, {
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      videoUrl: String(formData.get("videoUrl") ?? "").trim() || null,
    });
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link
          href={`/instructor/courses/${courseId}`}
          className="hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          ← Back to course
        </Link>
      </div>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
        Edit lesson
      </h1>

      <LessonEditForm
        action={saveLesson}
        initialTitle={lesson.title}
        initialVideoUrl={lesson.videoUrl ?? ""}
        initialContent={lesson.content}
      />

      <LessonAssessmentEditor
        lessonId={lessonId}
        quiz={lesson.quiz}
        assignments={lesson.assignments}
      />
    </main>
  );
}
