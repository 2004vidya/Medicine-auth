import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log("Middleware - Path:", pathname);
      console.log("Middleware - Token exists:", !!token);
      console.log("Middleware - User role:", token?.role);
    }

    // If user is authenticated but trying to access auth page, redirect to appropriate dashboard
    if (pathname === "/auth" && token && token.role) {
      const role = token.role;
      if (role === "MANUFACTURER") {
        return Response.redirect(new URL("/manufacturer/dashboard", req.url));
      } else if (role === "CUSTOMER") {
        return Response.redirect(new URL("/customer/dashboard", req.url));
      }
    }

    // Check role-based access for protected routes
    if (pathname.startsWith("/manufacturer")) {
      if (!token || token.role !== "MANUFACTURER") {
        return Response.redirect(new URL("/auth", req.url));
      }
    }

    if (pathname.startsWith("/customer")) {
      if (!token || token.role !== "CUSTOMER") {
        return Response.redirect(new URL("/auth", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow access to auth page and API routes
        if (pathname === "/auth" || pathname.startsWith("/api/")) {
          return true;
        }

        // Allow access to home page
        if (pathname === "/") {
          return true;
        }

        // Require authentication for protected routes
        if (pathname.startsWith("/manufacturer") || pathname.startsWith("/customer")) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/auth",
    "/customer/:path*",
    "/manufacturer/:path*"
  ]
};
