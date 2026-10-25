import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Protect /map and subpaths
  if (pathname === "/map" || pathname.startsWith("/map/")) {
    const sessionCookie = request.cookies.get("session");

    if (!sessionCookie || !sessionCookie.value) {
      const returnUrl = pathname + search;
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", returnUrl);
      loginUrl.searchParams.set("reason", "map");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/map", "/map/:path*"],
};
