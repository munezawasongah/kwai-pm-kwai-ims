import assert from "node:assert/strict";
import test from "node:test";
import {
  isCurrentEmployee, contractExpiringSoon, employmentTypeLabel,
  employmentStatusLabel, CURRENT_STATUSES, FORMER_STATUSES, EMPLOYMENT_STATUSES,
} from "../src/lib/employment";
import { roleHasCapability } from "../src/lib/permissions";

test("current and former statuses are exhaustive and disjoint", () => {
  const all = EMPLOYMENT_STATUSES.map((s) => s.value).sort();
  const split = [...CURRENT_STATUSES, ...FORMER_STATUSES].sort();
  assert.deepEqual(split, all, "every status must be either current or former");
  for (const s of CURRENT_STATUSES) {
    assert.ok(!(FORMER_STATUSES as readonly string[]).includes(s));
  }
});

test("employed statuses are recognised as current", () => {
  assert.equal(isCurrentEmployee("ACTIVE"), true);
  assert.equal(isCurrentEmployee("ON_LEAVE"), true);
  assert.equal(isCurrentEmployee("SUSPENDED"), true, "suspended staff are still employed");
});

test("departed statuses are not current", () => {
  for (const s of ["RESIGNED", "TERMINATED", "CONTRACT_ENDED", "RETIRED"]) {
    assert.equal(isCurrentEmployee(s), false, `${s} must count as former`);
  }
});

test("an unknown status is not treated as current", () => {
  assert.equal(isCurrentEmployee("SOMETHING_ELSE"), false);
});

test("fixed-term contracts expiring soon are flagged", () => {
  const soon = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  assert.equal(contractExpiringSoon("FIXED_TERM_CONTRACT", soon), true);
});

test("contracts far in the future are not flagged", () => {
  const later = new Date(Date.now() + 200 * 24 * 60 * 60 * 1000);
  assert.equal(contractExpiringSoon("FIXED_TERM_CONTRACT", later), false);
});

test("an already-expired contract is still flagged", () => {
  // Someone working past their contract end is a compliance problem, not a
  // resolved one — it must keep showing until corrected.
  const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  assert.equal(contractExpiringSoon("FIXED_TERM_CONTRACT", past), true);
});

test("permanent staff are never flagged for contract expiry", () => {
  const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  assert.equal(contractExpiringSoon("PERMANENT", soon), false);
  assert.equal(contractExpiringSoon("FIXED_TERM_CONTRACT", null), false);
});

test("labels are human readable", () => {
  assert.equal(employmentTypeLabel("FIXED_TERM_CONTRACT"), "Fixed-term contract");
  assert.equal(employmentStatusLabel("CONTRACT_ENDED"), "Contract ended");
});

test("HR can read and edit employee records", () => {
  assert.equal(roleHasCapability("HR", "staff:read"), true);
  assert.equal(roleHasCapability("HR", "staff:write"), true);
});

test("ordinary staff cannot open the employee database", () => {
  assert.equal(roleHasCapability("STAFF", "staff:read"), false);
  assert.equal(roleHasCapability("SALES_AGENT", "staff:read"), false);
  assert.equal(roleHasCapability("DRIVER_GUIDE", "staff:read"), false);
});
