import assert from "node:assert/strict";
import test from "node:test";
import { isPublicRoute } from "../src/lib/route-policy";

test("visitors can view every marketing page without an account", () => {
  const pages = ["/", "/about", "/destinations", "/experiences", "/voices", "/contact",
                 "/privacy", "/terms", "/safety"];
  for (const page of pages) {
    assert.equal(isPublicRoute(page), true, `${page} should be public`);
  }
});

test("marketing assets are reachable so the site renders for visitors", () => {
  assert.equal(isPublicRoute("/site/styles.css"), true);
  assert.equal(isPublicRoute("/site/main.js"), true);
  assert.equal(isPublicRoute("/site/index.html"), true);
});

test("visitors can submit the enquiry form", () => {
  assert.equal(isPublicRoute("/api/public/enquiry"), true);
});

test("staff login page is reachable while signed out", () => {
  assert.equal(isPublicRoute("/login"), true);
  assert.equal(isPublicRoute("/api/auth/callback/credentials"), true);
});

test("machine callers authenticated by other means stay reachable", () => {
  // Verified by HMAC signature, not a session.
  assert.equal(isPublicRoute("/api/webhooks/whatsapp"), true);
  // Verified by CRON_SECRET, not a session.
  assert.equal(isPublicRoute("/api/cron/notifications"), true);
  // Platform health probe runs before any user exists.
  assert.equal(isPublicRoute("/api/health"), true);
});

test("IMS pages are NOT public — visitors must never reach them", () => {
  const imsPages = [
    "/dashboard",
    "/clients",
    "/clients/abc123",
    "/bookings",
    "/bookings/abc123",
    "/invoices",
    "/invoices/abc123",
    "/inbox",
    "/fleet",
    "/staff",
  ];
  for (const page of imsPages) {
    assert.equal(isPublicRoute(page), false, `${page} must require a session`);
  }
});

test("IMS APIs are NOT public — client and financial data stays protected", () => {
  const imsApis = [
    "/api/clients",
    "/api/clients/abc123",
    "/api/bookings",
    "/api/invoices",
    "/api/invoices/abc123/payments",
    "/api/invoices/abc123/pdf",
    "/api/messages",
    "/api/vehicles",
    "/api/staff",
    "/api/itineraries/abc123",
  ];
  for (const api of imsApis) {
    assert.equal(isPublicRoute(api), false, `${api} must require a session`);
  }
});

test("a public prefix cannot be used to smuggle access to the IMS", () => {
  // These merely *contain* a public segment; they must not be treated as public.
  assert.equal(isPublicRoute("/dashboard/site"), false);
  assert.equal(isPublicRoute("/clients/api/public"), false);
  assert.equal(isPublicRoute("/bookings/login"), false);
});

test("unknown routes default to protected, not public", () => {
  assert.equal(isPublicRoute("/some-new-admin-page"), false);
  assert.equal(isPublicRoute("/api/some-new-endpoint"), false);
});
