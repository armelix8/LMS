import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isPublicLabsPath } from "@/lib/labs-public-paths";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (!req.auth) {
    if (isPublicLabsPath(pathname)) {
      return NextResponse.next();
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
    "/dashboard/:path*",
    "/instructor/:path*",
    "/learn/:path*",
    "/labs",
    "/labs/:path*",
    "/profile",
    "/admin/:path*",
  ],
};
