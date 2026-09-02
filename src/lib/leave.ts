/**
 * Leave rules.
 *
 * Statutory minimums below reflect Tanzania's Employment and Labour Relations Act
 * as a starting point, not legal advice. Entitlements change and vary by contract —
 * confirm the current figures with your HR adviser and adjust here. Each employee's
 * annual entitlement is stored per-user (`annualLeaveDays`) so it can be overridden.
 */

export const LEAVE_TYPES = [
  { value: "ANNUAL", label: "Annual leave", deductsFromBalance: true },
  { value: "SICK", label: "Sick leave", deductsFromBalance: false },
  { value: "MATERNITY", label: "Maternity leave", deductsFromBalance: false },
  { value: "PATERNITY", label: "Paternity leave", deductsFromBalance: false },
  { value: "COMPASSIONATE", label: "Compassionate leave", deductsFromBalance: false },
  { value: "STUDY", label: "Study leave", deductsFromBalance: false },
  { value: "UNPAID", label: "Unpaid leave", deductsFromBalance: false },
] as const;

export type LeaveTypeValue = (typeof LEAVE_TYPES)[number]["value"];

export function leaveTypeLabel(value: string): string {
  return LEAVE_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function deductsFromBalance(value: string): boolean {
  return LEAVE_TYPES.find((t) => t.value === value)?.deductsFromBalance ?? false;
}

/**
 * Count working days between two dates, inclusive, excluding weekends.
 *
 * Public holidays are not subtracted — that would need a maintained holiday
 * calendar, and silently miscounting is worse than counting plainly. HR can adjust
 * the day count on the request if a holiday falls inside the period.
 */
export function countWorkingDays(start: Date, end: Date): number {
  if (end < start) return 0;

  let days = 0;
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cursor <= last) {
    const d = cursor.getDay();
    if (d !== 0 && d !== 6) days++;   // 0 Sunday, 6 Saturday
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export interface LeaveRecord {
  type: string;
  days: number;
  status: string;
}

/**
 * Remaining annual leave.
 *
 * Only APPROVED and PENDING annual-leave days count against the balance: pending
 * requests are held so an employee cannot book the same days twice while waiting
 * for a decision.
 */
export function annualLeaveBalance(entitlementDays: number, records: LeaveRecord[]) {
  const counted = records.filter(
    (r) => deductsFromBalance(r.type) && (r.status === "APPROVED" || r.status === "PENDING")
  );
  const taken = counted
    .filter((r) => r.status === "APPROVED")
    .reduce((sum, r) => sum + r.days, 0);
  const pending = counted
    .filter((r) => r.status === "PENDING")
    .reduce((sum, r) => sum + r.days, 0);

  return {
    entitlement: entitlementDays,
    taken,
    pending,
    remaining: entitlementDays - taken - pending,
  };
}
