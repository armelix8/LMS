import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function CohortLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string; cohortSlug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    const { slug, cohortSlug } = await params;
    redirect(
      `/auth/signin?callbackUrl=${encodeURIComponent(`/programs/${slug}/cohorts/${cohortSlug}`)}`,
    );
  }
  return children;
}
