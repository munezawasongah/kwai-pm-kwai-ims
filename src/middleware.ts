import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { isPublicRoute } from "@/lib/route-policy";
import { resolveHost, isImsHost, isSharedHost, isImsPath, isMarketingPath } from "@/lib/host-policy";

/**
 * Two audiences, two hostnames, one deployment:
 *
 *   www.kwaipmkwaitravelandtours.com  visitors — marketing site, no account
 *   ims.kwaipmkwaitravelandtours.com  staff — management system, login required
 *
 * Requests are routed by hostname first, then by session. Every IMS API route
 * additionally enforces its own capability check; this middleware is a
 * convenience layer, never the only guard.
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // Must use the forwarded host: Railway and Cloudflare both proxy requests,
    // so the raw `host` header is not the hostname the visitor typed.
    const host = resolveHost(req.headers);
    const bareHost = (host ?? "").split(":")[0].toLowerCase();
    const onIms = isImsHost(host);
    const shared = isSharedHost(host);
    const token = req.nextauth?.token;

    // Shared hosts (localhost, *.up.railway.app) serve everything unchanged.
    if (!shared) {
      // Public domain: keep the staff application off it entirely.
      if (!onIms && isImsPath(pathname)) {
        const url = req.nextUrl.clone();
        url.hostname = `ims.${bareHost.replace(/^www\./, "")}`;
        url.port = "";
        url.protocol = "https:";
        return NextResponse.redirect(url);
      }

      // IMS domain: no marketing pages here.
      if (onIms && isMarketingPath(pathname)) {
        if (pathname === "/") {
          return NextResponse.redirect(new URL("/login", req.url));
        }
        const url = req.nextUrl.clone();
        url.hostname = `www.${bareHost.replace(/^ims\./, "")}`;
        url.port = "";
        url.protocol = "https:";
        return NextResponse.redirect(url);
      }
    }

    // A signed-in user has no reason to see the login page again.
    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        if (isPublicRoute(pathname)) return true;
        return !!token;
      },
    },
    pages: { signIn: "/login" },
  }
);

/**
 * Excludes Next internals and static assets so the marketing site's CSS, JS and
 * images are never gated behind auth.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|site/|branding/|generated/).*)"],
};
