import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Erlaube Zugriff auf Login-Seite ohne Authentifizierung
        if (req.nextUrl.pathname.startsWith("/login")) {
          return true;
        }
        
        // Erlaube Zugriff auf API-Routen für NextAuth
        if (req.nextUrl.pathname.startsWith("/api/auth")) {
          return true;
        }
        
        // Alle anderen Routen erfordern Authentifizierung
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Konfiguriere welche Pfade geschützt werden sollen
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};