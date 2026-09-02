import assert from "node:assert/strict";
import test from "node:test";
import { buildStaffEmail, slugifyNamePart } from "../src/lib/email-conventions";

const D = "kwaipmkwaitravelandtours.com";

test("builds firstname.lastname@domain", () => {
  assert.equal(buildStaffEmail("Evans", "Onyango", D), "evans.onyango@" + D);
  assert.equal(buildStaffEmail("Gabriel", "Msando", D), "gabriel.msando@" + D);
  assert.equal(buildStaffEmail("Emelina", "Lema", D), "emelina.lema@" + D);
});

test("lowercases and trims surrounding whitespace", () => {
  assert.equal(buildStaffEmail("  EVANS ", " Onyango  ", D), "evans.onyango@" + D);
});

test("apostrophes and punctuation are removed, not encoded", () => {
  // "O'Brien" must not become "o'brien@..." — an apostrophe is invalid here.
  assert.equal(buildStaffEmail("Mary", "O'Brien", D), "mary.obrien@" + D);
  assert.equal(buildStaffEmail("J.R.", "Smith", D), "jr.smith@" + D);
});

test("multi-part surnames become hyphenated, not broken", () => {
  assert.equal(buildStaffEmail("Anna", "van der Berg", D), "anna.van-der-berg@" + D);
});

test("accented characters are transliterated rather than dropped", () => {
  assert.equal(buildStaffEmail("José", "Müller", D), "jose.muller@" + D);
});

test("returns empty string when a name part is missing", () => {
  // Better to leave the field blank than to produce ".@domain".
  assert.equal(buildStaffEmail("", "Onyango", D), "");
  assert.equal(buildStaffEmail("Evans", "", D), "");
  assert.equal(buildStaffEmail("", "", D), "");
});

test("a name of only punctuation yields no address", () => {
  assert.equal(buildStaffEmail("!!!", "Onyango", D), "");
});

test("slugify keeps digits", () => {
  assert.equal(slugifyNamePart("Peter2"), "peter2");
});

test("generated addresses contain no characters invalid in an email local part", () => {
  const cases: [string, string][] = [
    ["Evans", "Onyango"], ["Mary", "O'Brien"], ["Anna", "van der Berg"], ["José", "Müller"],
  ];
  for (const [f, l] of cases) {
    const local = buildStaffEmail(f, l, D).split("@")[0];
    assert.match(local, /^[a-z0-9.-]+$/, `${f} ${l} produced "${local}"`);
  }
});
