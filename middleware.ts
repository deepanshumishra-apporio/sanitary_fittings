import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth is enforced client-side via the useAuth() hook (JWT in localStorage).
// No server-side session to check here — passthrough all requests.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
