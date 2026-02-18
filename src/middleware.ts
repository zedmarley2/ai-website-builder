import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  // Define protected route prefixes
  const protectedPrefixes = ["/dashboard", "/editor"];
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    nextUrl.pathname.startsWith(prefix),
  );

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/editor/:path*"],
};
