import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Coarse route-gating (UX only). Real auth + role checks are enforced by FastAPI.
// Next 16: the `middleware` convention was renamed to `proxy`.
export function proxy(_request: NextRequest) {
  // Pass-through for now. Add token/role checks here later, e.g.:
  //   const token = _request.cookies.get("access_token")?.value;
  //   if (!token) return NextResponse.redirect(new URL("/login", _request.url));
  return NextResponse.next();
}

export const config = {
  // Run on dashboard sections only; skip static assets and API.
  matcher: ["/patient/:path*", "/doctor/:path*", "/staff/:path*"],
};
