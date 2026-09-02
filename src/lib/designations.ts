/**
 * Job designations — what a person does in the company.
 *
 * Deliberately separate from `Role` in permissions.ts, which governs what they may
 * reach in this software. The two answer different questions:
 *
 *   jobTitle  "Human Resource Manager"  — their position in the organisation
 *   role      "STAFF"                   — what the system lets them open
 *
 * Conflating them causes real problems: a CEO does not automatically need to edit
 * invoices, and a cleaner should have a proper staff record without any access to
 * client data. The suggested role below is a starting point the admin can override.
 */

import type { AppRole } from "@/lib/permissions";

export interface Designation {
  title: string;
  department: string;
  /** Sensible default system role — always editable by the administrator. */
  suggestedRole: AppRole;
}

export const DESIGNATIONS: Designation[] = [
  // Leadership
  { title: "Chief Executive Officer", department: "Executive", suggestedRole: "ADMIN" },
  { title: "Managing Director", department: "Executive", suggestedRole: "ADMIN" },
  { title: "General Manager", department: "Executive", suggestedRole: "MANAGER" },
  { title: "Director", department: "Executive", suggestedRole: "MANAGER" },

  // Administration & people
  { title: "Human Resource Manager", department: "Human Resources", suggestedRole: "HR" },
  { title: "Human Resource Officer", department: "Human Resources", suggestedRole: "HR" },
  { title: "Administrative Assistant", department: "Administration", suggestedRole: "STAFF" },
  { title: "Receptionist", department: "Administration", suggestedRole: "STAFF" },
  { title: "Office Assistant", department: "Administration", suggestedRole: "STAFF" },

  // Finance
  { title: "Finance Manager", department: "Finance", suggestedRole: "ACCOUNTANT" },
  { title: "Accountant", department: "Finance", suggestedRole: "ACCOUNTANT" },
  { title: "Accounts Assistant", department: "Finance", suggestedRole: "ACCOUNTANT" },
  { title: "Cashier", department: "Finance", suggestedRole: "ACCOUNTANT" },

  // Sales & reservations
  { title: "Sales Manager", department: "Sales", suggestedRole: "MANAGER" },
  { title: "Sales Executive", department: "Sales", suggestedRole: "SALES_AGENT" },
  { title: "Reservations Officer", department: "Sales", suggestedRole: "SALES_AGENT" },
  { title: "Tour Consultant", department: "Sales", suggestedRole: "SALES_AGENT" },
  { title: "Marketing Officer", department: "Marketing", suggestedRole: "SALES_AGENT" },

  // Operations
  { title: "Operations Manager", department: "Operations", suggestedRole: "OPERATIONS" },
  { title: "Operations Officer", department: "Operations", suggestedRole: "OPERATIONS" },
  { title: "Fleet Manager", department: "Operations", suggestedRole: "OPERATIONS" },
  { title: "Logistics Coordinator", department: "Operations", suggestedRole: "OPERATIONS" },

  // Field staff
  { title: "Tour Guide", department: "Field", suggestedRole: "DRIVER_GUIDE" },
  { title: "Driver", department: "Field", suggestedRole: "DRIVER_GUIDE" },
  { title: "Driver / Guide", department: "Field", suggestedRole: "DRIVER_GUIDE" },
  { title: "Mountain Guide", department: "Field", suggestedRole: "DRIVER_GUIDE" },
  { title: "Camp Attendant", department: "Field", suggestedRole: "STAFF" },
  { title: "Chef", department: "Field", suggestedRole: "STAFF" },

  // Support
  { title: "Mechanic", department: "Workshop", suggestedRole: "STAFF" },
  { title: "IT Administrator", department: "IT", suggestedRole: "ADMIN" },
  { title: "Security Officer", department: "Support", suggestedRole: "STAFF" },
  { title: "Cleaner", department: "Support", suggestedRole: "STAFF" },
  { title: "Intern", department: "Support", suggestedRole: "STAFF" },
];

export const DEPARTMENTS = Array.from(new Set(DESIGNATIONS.map((d) => d.department))).sort();

export function findDesignation(title: string): Designation | undefined {
  return DESIGNATIONS.find((d) => d.title === title);
}

/** Designations grouped by department, for a grouped dropdown. */
export function designationsByDepartment(): Record<string, Designation[]> {
  return DESIGNATIONS.reduce<Record<string, Designation[]>>((acc, d) => {
    (acc[d.department] ||= []).push(d);
    return acc;
  }, {});
}
