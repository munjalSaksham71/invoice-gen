import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function middleware(request: NextRequest) {
  const token = (await cookies()).get("access_token")?.value;

  const url = request.nextUrl;

  // Redirect to dashboard if logged in and accessing login or signup pages
  if (
    token &&
    (url.pathname === "/login" ||
      url.pathname === "/signup" ||
      url.pathname === "/")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect to login if accessing dashboard without being logged in
  if (!token && (url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/products") || url.pathname.startsWith("/buyers") ||url.pathname.startsWith("/invoices"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// Define the routes where middleware should apply
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)',"/", "/login", "/signup", "/dashboard", "/products", "/buyers", "/invoices/:path*"],
};
