import Link from "next/link";
import { notFound } from "next/navigation";
import {
  InstructorBreadcrumbs,
  InstructorPageShell,
  InstructorPageTitle,
  instructorSecondaryButtonClass,
} from "@/components/instructor-page-chrome";
import { InstructorLessonEditNav } from "@/components/instructor-lesson-edit-nav";
import { LessonAssessmentEditor } from "@/components/lesson-assessment-editor";
import { LessonEditForm } from "@/components/lesson-edit-form";
import { updateLesson } from "@/app/actions/lms";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string; lessonId: string }> };

export async function generateMetadata({ params }: Props) {
  try {
    const { lessonId } = await params;
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { title: true },
    });
    return {
      title: lesson ? `Edit · ${lesson.title}` : "Edit lesson",
    };
  } catch {
    return { title: "Edit lesson" };
  }
}

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

  const pendingReviewCount = lesson.assignments.reduce(
    (n, a) =>
      n + a.submissions.filter((s) => s.reviewStatus === "PENDING").length,
    0,
  );
  const quizQuestionCount = lesson.quiz?.questions.length ?? 0;
  if (
    session.user.role !== "ADMIN" &&
    course.instructorId !== session.user.id
  ) {
    notFound();
  }

  async function saveLesson(formData: FormData) {
    "use server";
    const rawContent = String(formData.get("content") ?? "");
    await updateLesson(lessonId, {
      title: String(formData.get("title") ?? ""),
      content: rawContent,
    });
  }

  return (
    <InstructorPageShell maxWidthClass="max-w-6xl">
      <InstructorBreadcrumbs
        items={[
          { href: "/instructor/courses", label: "Courses" },
          { href: `/instructor/courses/${courseId}`, label: course.title },
          { label: lesson.title },
        ]}
      />

      <div className="mt-6">
        <InstructorPageTitle
          eyebrow={lesson.module.title}
          title={lesson.title}
          description="Edit lesson content, video, quiz, and assignments. Learners see changes after you save."
          actions={
            <Link
              href={`/instructor/courses/${courseId}`}
              className={instructorSecondaryButtonClass}
            >
              Back to course
            </Link>
          }
        />
      </div>

      <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12 xl:gap-14">
        <InstructorLessonEditNav
          questionCount={quizQuestionCount}
          assignmentCount={lesson.assignments.length}
          pendingReviewCount={pendingReviewCount}
        />
        <div className="min-w-0 flex-1 space-y-0">
          <LessonEditForm
            key={lessonId}
            action={saveLesson}
            lessonId={lessonId}
            initialTitle={lesson.title}
            initialVideoUrl={lesson.videoUrl ?? ""}
            initialContent={lesson.content}
          />

          <LessonAssessmentEditor
            lessonId={lessonId}
            quiz={lesson.quiz}
            assignments={lesson.assignments}
          />
        </div>
      </div>
    </InstructorPageShell>
  );
}
