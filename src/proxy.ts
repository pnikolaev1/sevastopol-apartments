import createMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth/edge";
import { routing } from "@/i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next 16 renamed the `middleware` file convention to `proxy`. next-intl still
// ships its handler under `next-intl/middleware`; that's just the package's
// import path and is unrelated to the file-convention rename.
const intlProxy = createMiddleware(routing);

export default auth(function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin route protection is handled in authConfig.callbacks.authorized
  // Apply i18n routing to all non-admin, non-api, non-internal routes
  if (
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/favicon") &&
    pathname !== "/sitemap.xml" &&
    pathname !== "/robots.txt"
  ) {
    return intlProxy(req);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
