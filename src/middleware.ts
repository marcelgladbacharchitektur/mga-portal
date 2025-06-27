import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
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
     * - api/test-dashboard (test endpoint)
     * - api/calendar/debug (debug endpoint)
     * - api/fix-admin-password (admin fix endpoint)
     * - api/availability (public booking availability)
     * - api/book-appointment (public booking)
     * - api/booking-tokens (booking token validation)
     * - api/test-availability (test endpoint)
     * - buchung/* (public booking pages)
     * - termin-buchen/* (public booking pages)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/calendar/debug|api/calendar/status|api/fix-admin-password|api/auth/temp-admin|api/availability|api/availability-test|api/book-appointment|api/booking-tokens|api/test-availability|buchung|termin-buchen).*)",
  ],
};