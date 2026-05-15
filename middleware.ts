import { NextResponse } from "next/server";
import { auth } from "@/auth";

/** Public file extensions served from /public (sign-in page assets, etc.) */
const STATIC_FILE =
  /\.(?:ico|png|jpe?g|gif|webp|svg|woff2?|txt|xml|webmanifest|map)$/i;

function isExemptFromAuth(pathname: string): boolean {
  if (pathname.startsWith("/auth")) {
    return true;
  }
  if (pathname.startsWith("/api/auth")) {
    return true;
  }
  if (pathname.startsWith("/_next")) {
    return true;
  }
  if (STATIC_FILE.test(pathname)) {
    return true;
  }
  return false;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (isExemptFromAuth(pathname)) {
    return NextResponse.next();
  }

  if (!req.auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signIn = new URL("/auth/signin", req.nextUrl.origin);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
  }

  if (pathname.startsWith("/instructor")) {
    const role = req.auth.user?.role;
    if (role !== "INSTRUCTOR" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
  }

  if (pathname.startsWith("/admin")) {
    const role = req.auth.user?.role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * All routes except Next.js static assets and the image optimizer.
     * Auth vs public is decided in isExemptFromAuth().
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
