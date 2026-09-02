/**
 * Employment classifications.
 *
 * A former employee is never deleted from the system. Payroll, tax and labour-law
 * obligations outlast the employment, and deleting the record would orphan every
 * booking they handled, expense they logged and leave day they took. Departure is
 * recorded, not erased.
 */

export const EMPLOYMENT_TYPES = [
  { value: "PERMANENT", label: "Permanent", note: "Open-ended contract" },
  { value: "FIXED_TERM_CONTRACT", label: "Fixed-term contract", note: "Ends on a set date" },
  { value: "PROBATION", label: "Probation", note: "Under review before confirmation" },
  { value: "CASUAL", label: "Casual", note: "Engaged as needed" },
  { value: "INTERNSHIP", label: "Internship", note: "Training placement" },
  { value: "CONSULTANT", label: "Consultant", note: "Engaged under a service agreement" },
] as const;

/** Statuses that mean the person still works here. */
export const CURRENT_STATUSES = ["ACTIVE", "ON_LEAVE", "SUSPENDED"] as const;

/** Statuses that mean the employment has ended. */
export const FORMER_STATUSES = ["RESIGNED", "TERMINATED", "CONTRACT_ENDED", "RETIRED"] as const;

export const EMPLOYMENT_STATUSES = [
  { value: "ACTIVE", label: "Active", current: true },
  { value: "ON_LEAVE", label: "On leave", current: true },
  { value: "SUSPENDED", label: "Suspended", current: true },
  { value: "RESIGNED", label: "Resigned", current: false },
  { value: "TERMINATED", label: "Terminated", current: false },
  { value: "CONTRACT_ENDED", label: "Contract ended", current: false },
  { value: "RETIRED", label: "Retired", current: false },
] as const;

export function employmentTypeLabel(value: string): string {
  return EMPLOYMENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function employmentStatusLabel(value: string): string {
  return EMPLOYMENT_STATUSES.find((s) => s.value === value)?.label ?? value;
}

/** True when the status represents someone still employed. */
export function isCurrentEmployee(status: string): boolean {
  return (CURRENT_STATUSES as readonly string[]).includes(status);
}

/**
 * A fixed-term contract expiring within `days` needs attention before it lapses —
 * an employee working on an expired contract is a compliance problem.
 */
export function contractExpiringSoon(
  employmentType: string,
  contractEndDate: Date | null | undefined,
  days = 30
): boolean {
  if (employmentType !== "FIXED_TERM_CONTRACT" || !contractEndDate) return false;
  const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return contractEndDate <= cutoff;
}
