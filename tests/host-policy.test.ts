import assert from "node:assert/strict";
import test from "node:test";
import { isImsHost, isPublicSiteHost, isImsPath, isMarketingPath } from "../src/lib/host-policy";

const SITE = "www.kwaipmkwaitravelandtours.com";
const ROOT = "kwaipmkwaitravelandtours.com";
const IMS = "ims.kwaipmkwaitravelandtours.com";

test("the ims subdomain is recognised as the staff host", () => {
  assert.equal(isImsHost(IMS), true);
  assert.equal(isImsHost("IMS.KwaiPmKwaiTravelAndTours.com"), true, "must be case-insensitive");
  assert.equal(isImsHost("ims.kwaipmkwaitravelandtours.com:443"), true, "must ignore the port");
});

test("public hostnames are not treated as the staff host", () => {
  assert.equal(isImsHost(SITE), false);
  assert.equal(isImsHost(ROOT), false);
  assert.equal(isPublicSiteHost(SITE), true);
  assert.equal(isPublicSiteHost(ROOT), true);
});

test("development and Railway hosts serve everything", () => {
  // Otherwise the app would be unusable before custom domains are attached.
  assert.equal(isImsHost("localhost"), true);
  assert.equal(isImsHost("localhost:3000"), true);
  assert.equal(isImsHost("kwai-pm-kwai-ims-production.up.railway.app"), true);
});

test("a missing host does not accidentally grant IMS routing", () => {
  assert.equal(isImsHost(null), false);
  assert.equal(isImsHost(undefined), false);
  assert.equal(isImsHost(""), false);
});

test("a lookalike hostname is not accepted as the IMS host", () => {
  // "ims" must be a subdomain label, not merely a prefix of one.
  assert.equal(isImsHost("imsomething.com"), false);
  assert.equal(isImsHost("ims-fake.com"), false);
});

test("IMS paths are identified", () => {
  for (const p of ["/dashboard", "/clients", "/clients/abc", "/bookings/xyz",
                   "/invoices", "/inbox", "/fleet", "/staff", "/login"]) {
    assert.equal(isImsPath(p), true, `${p} should be an IMS path`);
  }
});

test("marketing paths are not IMS paths", () => {
  for (const p of ["/", "/about", "/destinations", "/experiences",
                   "/voices", "/contact", "/privacy", "/terms", "/safety"]) {
    assert.equal(isImsPath(p), false, `${p} should not be an IMS path`);
    assert.equal(isMarketingPath(p), true, `${p} should be a marketing path`);
  }
});

test("a path merely starting with an IMS word is not an IMS path", () => {
  // "/staff-picks" is marketing copy, not the staff module.
  assert.equal(isImsPath("/staff-picks"), false);
  assert.equal(isImsPath("/fleet-of-vehicles"), false);
});

// --- proxy-aware host resolution -------------------------------------------
// Railway and Cloudflare both proxy requests, so the raw `host` header is not
// the hostname the visitor typed. Reading it alone silently disabled all
// host-based routing in production; these lock the behaviour in.

import { resolveHost, isSharedHost } from "../src/lib/host-policy";

function headers(map: Record<string, string>) {
  return { get: (n: string) => map[n.toLowerCase()] ?? null };
}

test("x-forwarded-host takes precedence over the raw host header", () => {
  const h = headers({
    "x-forwarded-host": "ims.kwaipmkwaitravelandtours.com",
    host: "internal-railway-host.railway.internal",
  });
  assert.equal(resolveHost(h), "ims.kwaipmkwaitravelandtours.com");
  assert.equal(isImsHost(resolveHost(h)), true);
});

test("falls back to the host header when nothing is forwarded", () => {
  assert.equal(resolveHost(headers({ host: "www.kwaipmkwaitravelandtours.com" })),
               "www.kwaipmkwaitravelandtours.com");
});

test("only the first entry of a comma-separated forwarded host is used", () => {
  const h = headers({ "x-forwarded-host": "ims.kwaipmkwaitravelandtours.com, proxy.internal" });
  assert.equal(resolveHost(h), "ims.kwaipmkwaitravelandtours.com");
});

test("no host headers at all resolves to null and is not an IMS host", () => {
  assert.equal(resolveHost(headers({})), null);
  assert.equal(isImsHost(resolveHost(headers({}))), false);
});

test("shared hosts are identified so no redirects apply to them", () => {
  assert.equal(isSharedHost("localhost:3000"), true);
  assert.equal(isSharedHost("kwai-pm-kwai-ims-production.up.railway.app"), true);
  assert.equal(isSharedHost("www.kwaipmkwaitravelandtours.com"), false);
  assert.equal(isSharedHost("ims.kwaipmkwaitravelandtours.com"), false);
});
