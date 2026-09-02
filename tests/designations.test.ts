import assert from "node:assert/strict";
import test from "node:test";
import { DESIGNATIONS, findDesignation, designationsByDepartment, DEPARTMENTS } from "../src/lib/designations";
import { roleHasCapability, ALL_ROLES, PERMISSIONS } from "../src/lib/permissions";

test("the designations the user asked for are present", () => {
  for (const t of ["Chief Executive Officer", "Human Resource Manager", "Cleaner"]) {
    assert.ok(findDesignation(t), `${t} should be a selectable designation`);
  }
});

test("every designation maps to a real system role", () => {
  for (const d of DESIGNATIONS) {
    assert.ok(ALL_ROLES.includes(d.suggestedRole),
      `${d.title} suggests unknown role ${d.suggestedRole}`);
  }
});

test("designations are grouped under a department", () => {
  const grouped = designationsByDepartment();
  assert.ok(DEPARTMENTS.length > 3);
  for (const dept of DEPARTMENTS) {
    assert.ok(grouped[dept].length > 0, `${dept} should contain designations`);
  }
});

test("no duplicate job titles", () => {
  const titles = DESIGNATIONS.map((d) => d.title);
  assert.equal(new Set(titles).size, titles.length);
});

test("support staff default to no operational access", () => {
  // A cleaner or security officer needs an account and a record, not access to
  // client data or finances.
  for (const title of ["Cleaner", "Security Officer", "Office Assistant"]) {
    assert.equal(findDesignation(title)!.suggestedRole, "STAFF");
  }
});

test("the STAFF role grants no operational access", () => {
  // STAFF may see the staff directory — knowing your colleagues is not sensitive —
  // but nothing else. Everything operational or financial stays closed.
  for (const cap of Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]) {
    if (cap === "directory:read") continue;
    assert.equal(roleHasCapability("STAFF", cap), false,
      `STAFF must not hold ${cap}`);
  }
  assert.equal(roleHasCapability("STAFF", "directory:read"), true);
});

test("HR designations map to the HR role, which is people-only", () => {
  assert.equal(findDesignation("Human Resource Manager")!.suggestedRole, "HR");
  assert.equal(findDesignation("Human Resource Officer")!.suggestedRole, "HR");
  // Managing people does not imply reading bookings or financials.
  assert.equal(roleHasCapability("HR", "bookings:read"), false);
  assert.equal(roleHasCapability("HR", "financials:read"), false);
});

test("field staff default to the driver/guide role", () => {
  for (const title of ["Tour Guide", "Driver", "Driver / Guide"]) {
    assert.equal(findDesignation("" + title)!.suggestedRole, "DRIVER_GUIDE");
  }
});
