import assert from "node:assert/strict";
import test from "node:test";
import { convert, sumInCurrency, computeProfit } from "../src/lib/currency";
import { roleHasCapability } from "../src/lib/permissions";

const RATE = 2600;

test("convert returns the same amount when currencies match", () => {
  assert.equal(convert(100, "USD", "USD", RATE), 100);
  assert.equal(convert(100, "TZS", "TZS", RATE), 100);
});

test("convert TZS to USD divides by the rate", () => {
  assert.equal(convert(2600, "TZS", "USD", RATE), 1);
});

test("convert USD to TZS multiplies by the rate", () => {
  assert.equal(convert(1, "USD", "TZS", RATE), 2600);
});

test("sumInCurrency normalizes a mixed-currency set", () => {
  const rows = [
    { amount: 100, currency: "USD" },
    { amount: 260000, currency: "TZS" }, // = 100 USD
  ];
  assert.equal(sumInCurrency(rows, "USD", RATE), 200);
});

test("sumInCurrency ignores non-numeric amounts rather than producing NaN", () => {
  const rows = [
    { amount: 50, currency: "USD" },
    { amount: "not-a-number", currency: "USD" },
  ];
  assert.equal(sumInCurrency(rows, "USD", RATE), 50);
});

test("computeProfit subtracts TZS expenses from USD revenue correctly", () => {
  // This is the bug the naive implementation had: 1000 USD revenue minus
  // 1,300,000 TZS expenses is a 500 USD profit, NOT -1,299,000.
  const payments = [{ amount: 1000, currency: "USD" }];
  const expenses = [{ amount: 1_300_000, currency: "TZS" }];

  const result = computeProfit(payments, expenses, "USD");

  assert.equal(result.totalRevenue, 1000);
  assert.equal(result.totalExpenses, 500);
  assert.equal(result.netProfit, 500);
});

test("computeProfit discloses the rate it used", () => {
  const result = computeProfit([], [], "USD");
  assert.ok(result.rateUsed > 0);
  assert.equal(result.base, "USD");
});

test("computeProfit handles a loss without sign errors", () => {
  const payments = [{ amount: 100, currency: "USD" }];
  const expenses = [{ amount: 780_000, currency: "TZS" }]; // 300 USD
  const result = computeProfit(payments, expenses, "USD");
  assert.equal(result.netProfit, -200);
});

test("drivers cannot reach financial data", () => {
  assert.equal(roleHasCapability("DRIVER_GUIDE", "financials:read"), false);
  assert.equal(roleHasCapability("DRIVER_GUIDE", "payments:write"), false);
  assert.equal(roleHasCapability("DRIVER_GUIDE", "invoices:read"), false);
  assert.equal(roleHasCapability("DRIVER_GUIDE", "clients:read"), false);
});

test("accountants can handle money but not fleet operations", () => {
  assert.equal(roleHasCapability("ACCOUNTANT", "payments:write"), true);
  assert.equal(roleHasCapability("ACCOUNTANT", "financials:read"), true);
  assert.equal(roleHasCapability("ACCOUNTANT", "fleet:write"), false);
});

test("sales agents can quote but cannot record payments", () => {
  assert.equal(roleHasCapability("SALES_AGENT", "bookings:write"), true);
  assert.equal(roleHasCapability("SALES_AGENT", "payments:write"), false);
  assert.equal(roleHasCapability("SALES_AGENT", "clients:delete"), false);
});

test("admin has every capability", () => {
  const caps = [
    "clients:write",
    "clients:delete",
    "bookings:write",
    "invoices:write",
    "payments:write",
    "financials:read",
    "fleet:write",
    "staff:write",
    "messages:write",
  ] as const;
  for (const cap of caps) {
    assert.equal(roleHasCapability("ADMIN", cap), true, `ADMIN should have ${cap}`);
  }
});

test("an unknown or missing role is denied everything", () => {
  assert.equal(roleHasCapability(undefined, "clients:read"), false);
  assert.equal(roleHasCapability("NOT_A_ROLE", "clients:read"), false);
});
