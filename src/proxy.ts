import { NextResponse, type NextRequest } from "next/server";
import { isLandingOnly } from "@/lib/site";

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\]|[a-z0-9-]+\.localhost)(:\d+)?$/i;

export function proxy(request: NextRequest) {
  // The public deployment only has the landing page; the dashboard needs a local install.
  if (isLandingOnly()) {
    return NextResponse.redirect(new URL("/#install", request.url));
  }

  // Webhook deliveries arrive through a tunnel and are verified by their signature instead.
  if (request.nextUrl.pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next();
  }

  // The dashboard can run code on this machine, so only answer requests addressed to
  // localhost. This blocks DNS rebinding from other websites.
  if (!LOCAL_HOST.test(request.headers.get("host") ?? "")) {
    return new NextResponse("Grove only answers requests addressed to localhost.", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
