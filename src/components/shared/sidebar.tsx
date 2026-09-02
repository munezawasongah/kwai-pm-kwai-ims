"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { roleHasCapability, type Capability } from "@/lib/permissions";

const NAV: { href: string; label: string; capability: Capability }[] = [
  { href: "/dashboard", label: "Dashboard", capability: "bookings:read" },
  { href: "/clients", label: "Clients", capability: "clients:read" },
  { href: "/bookings", label: "Bookings", capability: "bookings:read" },
  { href: "/invoices", label: "Invoices", capability: "invoices:read" },
  { href: "/inbox", label: "Inbox", capability: "messages:read" },
  { href: "/fleet", label: "Fleet", capability: "fleet:read" },
  { href: "/staff", label: "Employees", capability: "staff:read" },
  { href: "/hr/directory", label: "Staff Directory", capability: "directory:read" },
  { href: "/hr/leave", label: "Leave Requests", capability: "hr:read" },
  { href: "/settings/users", label: "Staff Accounts", capability: "users:read" },
];

// Always visible to any signed-in user — these act only on the user's own account
// or show information that reveals no data.
const PERSONAL_NAV = [
  { href: "/settings/leave", label: "My Leave" },
  { href: "/settings/permissions", label: "Who sees what" },
  { href: "/settings/password", label: "My Password" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  // Hide what the user can't access. The API enforces this independently —
  // hiding nav is a usability measure, never the security boundary.
  const visible = NAV.filter((item) => roleHasCapability(role, item.capability));

  return (
    <aside className="hidden w-56 shrink-0 border-r bg-white md:block">
      <div className="border-b px-6 py-5">
        <p className="text-lg font-bold text-brand">kwai pm kwai</p>
        <p className="text-xs text-gray-400">Internal Management System</p>
      </div>
      <nav className="p-3">
        {visible.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mb-1 block rounded px-3 py-2 text-sm font-medium",
                active ? "bg-brand text-white" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {item.label}
            </Link>
          );
        })}
        <div className="mt-4 border-t pt-3">
          {PERSONAL_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "mb-1 block rounded px-3 py-2 text-xs font-medium",
                  active ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
