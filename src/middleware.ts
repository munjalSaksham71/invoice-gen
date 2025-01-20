import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function middleware(request: NextRequest) {
  // Initialize the Supabase client
  const cookieStore = await cookies();
  const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() }, { cookies: () => cookieStore });

  // Fetch the session
  const { data: { session } } = await supabase.auth.getSession();

  const url = request.nextUrl;

  // Redirect to dashboard if logged in and accessing login, signup, or home page
  if (
    session &&
    (url.pathname === "/login" ||
      url.pathname === "/signup" ||
      url.pathname === "/")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect to login if accessing protected routes without being logged in
  if (
    !session &&
    (url.pathname.startsWith("/dashboard") ||
      url.pathname.startsWith("/products") ||
      url.pathname.startsWith("/buyers") ||
      url.pathname.startsWith("/invoices"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Continue with the request
  return NextResponse.next();
}

// Define the routes where middleware should apply
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    "/",
    "/login",
    "/signup",
    "/dashboard",
    "/products",
    "/buyers",
    "/invoices/:path*",
  ],
};