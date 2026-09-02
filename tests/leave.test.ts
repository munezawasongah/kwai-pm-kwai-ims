import assert from "node:assert/strict";
import test from "node:test";
import { countWorkingDays, annualLeaveBalance, deductsFromBalance } from "../src/lib/leave";
import { roleHasCapability } from "../src/lib/permissions";

test("counts a single weekday as one day", () => {
  const mon = new Date(2026, 8, 7);
  assert.equal(countWorkingDays(mon, mon), 1);
});

test("excludes weekends", () => {
  // Mon 7 Sep 2026 to Fri 11 Sep = 5 working days
  assert.equal(countWorkingDays(new Date(2026, 8, 7), new Date(2026, 8, 11)), 5);
  // Mon 7 to Mon 14 spans a weekend = 6 working days
  assert.equal(countWorkingDays(new Date(2026, 8, 7), new Date(2026, 8, 14)), 6);
});

test("a weekend-only period counts as zero", () => {
  // Sat 12 and Sun 13 Sep 2026
  assert.equal(countWorkingDays(new Date(2026, 8, 12), new Date(2026, 8, 13)), 0);
});

test("an end date before the start counts as zero, not negative", () => {
  assert.equal(countWorkingDays(new Date(2026, 8, 11), new Date(2026, 8, 7)), 0);
});

test("only annual leave reduces the balance", () => {
  assert.equal(deductsFromBalance("ANNUAL"), true);
  for (const t of ["SICK", "MATERNITY", "PATERNITY", "COMPASSIONATE", "STUDY", "UNPAID"]) {
    assert.equal(deductsFromBalance(t), false, `${t} must not reduce annual leave`);
  }
});

test("balance subtracts approved and pending annual leave", () => {
  const b = annualLeaveBalance(28, [
    { type: "ANNUAL", days: 5, status: "APPROVED" },
    { type: "ANNUAL", days: 3, status: "PENDING" },
  ]);
  assert.equal(b.taken, 5);
  assert.equal(b.pending, 3);
  assert.equal(b.remaining, 20);
});

test("rejected and cancelled requests do not consume balance", () => {
  const b = annualLeaveBalance(28, [
    { type: "ANNUAL", days: 10, status: "REJECTED" },
    { type: "ANNUAL", days: 4, status: "CANCELLED" },
  ]);
  assert.equal(b.remaining, 28);
});

test("sick leave does not consume annual balance", () => {
  const b = annualLeaveBalance(28, [{ type: "SICK", days: 10, status: "APPROVED" }]);
  assert.equal(b.remaining, 28);
});

test("HR can approve leave and read personnel records", () => {
  assert.equal(roleHasCapability("HR", "hr:read"), true);
  assert.equal(roleHasCapability("HR", "leave:approve"), true);
});

test("HR cannot reach client, booking or financial data", () => {
  for (const cap of ["clients:read", "bookings:read", "invoices:read", "financials:read", "payments:write"] as const) {
    assert.equal(roleHasCapability("HR", cap), false, `HR must not hold ${cap}`);
  }
});

test("HR cannot create user accounts — that stays with administrators", () => {
  assert.equal(roleHasCapability("HR", "users:write"), false);
});

test("ordinary staff can see the directory but not personnel records", () => {
  assert.equal(roleHasCapability("STAFF", "directory:read"), true);
  assert.equal(roleHasCapability("STAFF", "hr:read"), false);
  assert.equal(roleHasCapability("DRIVER_GUIDE", "directory:read"), true);
  assert.equal(roleHasCapability("DRIVER_GUIDE", "hr:read"), false);
});
