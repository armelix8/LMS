import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sendCourseMessage } from "@/app/actions/course-messages";
import { CourseChatPanel } from "@/components/course-chat-panel";
import { auth } from "@/auth";
import { toCourseChatMessageVMs } from "@/lib/course-chat";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  try {
    const { slug } = await params;
    const course = await prisma.course.findUnique({
      where: { slug },
      select: { title: true, published: true, instructorId: true, id: true },
    });
    if (!course) return { title: "Messages" };

    const session = await auth();
    let visible = course.published;
    if (!visible && session?.user) {
      if (
        session.user.role === "ADMIN" ||
        session.user.id === course.instructorId
      ) {
        visible = true;
      } else {
        const e = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: session.user.id,
              courseId: course.id,
            },
          },
          select: { status: true },
        });
        visible = e?.status === "ACTIVE";
      }
    }
    if (!visible) return { title: "Messages" };

    return { title: `Messages · ${course.title}` };
  } catch {
    return { title: "Messages" };
  }
}

export default async function CourseMessagesPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=/learn/${slug}/messages`);
  }

  const course = await prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      published: true,
      instructorId: true,
    },
  });
  if (!course) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId: course.id },
    },
  });

  const isStaff =
    session.user.role === "ADMIN" ||
    session.user.id === course.instructorId;

  if (!isStaff) {
    if (!enrollment) {
      if (course.published) redirect(`/courses/${slug}`);
      notFound();
    }
    if (enrollment.status !== "ACTIVE") {
      redirect(
        `/courses/${slug}?enrollment=${
          enrollment.status === "PENDING" ? "pending" : "rejected"
        }`,
      );
    }
  } else if (!enrollment) {
    redirect(`/learn/${slug}`);
  }

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { studentMessagesReadAt: new Date() },
  });

  const rows = await prisma.courseMessage.findMany({
    where: { enrollmentId: enrollment.id },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { name: true, email: true } },
    },
  });

  const messages = toCourseChatMessageVMs(rows);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link
          href={`/learn/${slug}`}
          className="hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          ← Back to lessons
        </Link>
      </div>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
        Messages · {course.title}
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Chat with your instructor. Replies appear here and in the instructor
        view for this course.
      </p>

      <div className="mt-8">
        <CourseChatPanel
          enrollmentId={enrollment.id}
          studentUserId={session.user.id}
          messages={messages}
          sendMessage={sendCourseMessage.bind(null, enrollment.id)}
        />
      </div>
    </main>
  );
}
