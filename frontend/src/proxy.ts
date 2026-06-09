import { NextRequest, NextResponse } from "next/server";
import { TOKEN_KEY } from "@/lib/auth";

// Routes that do NOT require authentication
const PUBLIC_PATHS = ["/", "/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through without any check
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Read token from cookie (localStorage is not accessible on the Edge)
  const token = request.cookies.get(TOKEN_KEY)?.value;

  // No token -> redirect to login, preserve the original destination
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists -> let the request through
  // Real authorization is enforced by FastAPI on every API call
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/patient/:path*",
    "/doctor/:path*",
    "/staff/:path*",
  ],
};