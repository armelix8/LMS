import { signOutAction } from "@/app/actions/auth";
import { auth } from "@/auth";
import { SiteHeaderNav } from "@/components/site-header-nav";
import { getNotificationPreview } from "@/lib/notifications";

export async function SiteHeader() {
  const session = await auth();

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      }
    : null;

  const notificationPreview =
    session?.user?.id != null
      ? await getNotificationPreview(session.user.id)
      : null;

  return (
    <header className="sticky top-0 z-50 border-b border-teal-900/10 bg-white/90 shadow-sm backdrop-blur-md dark:border-teal-200/10 dark:bg-teal-950/90 dark:shadow-[0_1px_0_0_rgba(45,212,191,0.08)]">
      <SiteHeaderNav
        user={user}
        signOutAction={signOutAction}
        notificationPreview={notificationPreview}
      />
    </header>
  );
}
