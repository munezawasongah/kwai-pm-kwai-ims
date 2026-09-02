import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { roleHasCapability } from "@/lib/permissions";
import {
  employmentTypeLabel, employmentStatusLabel, isCurrentEmployee,
  contractExpiringSoon, CURRENT_STATUSES, FORMER_STATUSES,
} from "@/lib/employment";
import { Card } from "@/components/ui/card";
import { NewUserDialog } from "@/components/users/new-user-dialog";

/**
 * The employee database — current and former staff.
 *
 * Former employees are retained deliberately: payroll and labour-law obligations
 * outlast the employment, and their bookings, expenses and leave history reference
 * them. Departure is recorded, never deleted.
 */
export default async function StaffPage({
  searchParams,
}: {
  searchParams: { view?: string; dept?: string; type?: string };
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!roleHasCapability(role, "staff:read")) redirect("/dashboard");

  const canWrite = roleHasCapability(role, "staff:write");
  const view = searchParams.view === "former" ? "former" : "current";

  const employees = await prisma.user.findMany({
    where: {
      employmentStatus: {
        in: (view === "current" ? CURRENT_STATUSES : FORMER_STATUSES) as unknown as any,
      },
      ...(searchParams.dept ? { department: searchParams.dept } : {}),
      ...(searchParams.type ? { employmentType: searchParams.type as any } : {}),
    },
    orderBy: [{ department: "asc" }, { firstName: "asc" }],
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      jobTitle: true, department: true, employeeNumber: true, role: true,
      employmentType: true, employmentStatus: true,
      startDate: true, endDate: true, contractEndDate: true, isActive: true,
    },
  });

  const [currentCount, formerCount] = await Promise.all([
    prisma.user.count({ where: { employmentStatus: { in: CURRENT_STATUSES as unknown as any } } }),
    prisma.user.count({ where: { employmentStatus: { in: FORMER_STATUSES as unknown as any } } }),
  ]);

  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean))
  ).sort() as string[];

  const expiring = employees.filter((e) => contractExpiringSoon(e.employmentType, e.contractEndDate));

  return (
    <div className="p-8">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Employees</h1>
        {canWrite && <NewUserDialog />}
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Every employee, current and former. Records of people who have left are kept —
        their bookings, expenses and leave history depend on them.
      </p>

      {expiring.length > 0 && (
        <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <strong>{expiring.length}</strong> fixed-term contract
          {expiring.length === 1 ? "" : "s"} expiring within 30 days:{" "}
          {expiring.map((e) => `${e.firstName} ${e.lastName}`).join(", ")}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/staff?view=current"
          className={`rounded-full border px-4 py-1.5 text-sm ${view === "current" ? "border-brand bg-brand text-white" : "bg-white text-gray-600"}`}
        >
          Current ({currentCount})
        </Link>
        <Link
          href="/staff?view=former"
          className={`rounded-full border px-4 py-1.5 text-sm ${view === "former" ? "border-brand bg-brand text-white" : "bg-white text-gray-600"}`}
        >
          Former ({formerCount})
        </Link>
        {departments.map((d) => (
          <Link
            key={d}
            href={`/staff?view=${view}&dept=${encodeURIComponent(d)}`}
            className={`rounded-full border px-3 py-1.5 text-xs ${searchParams.dept === d ? "border-brand text-brand" : "bg-white text-gray-500"}`}
          >
            {d}
          </Link>
        ))}
        {(searchParams.dept || searchParams.type) && (
          <Link href={`/staff?view=${view}`} className="px-3 py-1.5 text-xs text-brand hover:underline">
            Clear filters
          </Link>
        )}
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3">Employee</th>
              <th className="px-6 py-3">Designation</th>
              <th className="px-6 py-3">Department</th>
              <th className="px-6 py-3">Employment</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">{view === "current" ? "Started" : "Left"}</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-6 py-3">
                  <Link href={`/staff/${e.id}`} className="font-medium text-brand hover:underline">
                    {e.firstName} {e.lastName}
                  </Link>
                  <div className="text-xs text-gray-400">
                    {e.employeeNumber ? `${e.employeeNumber} · ` : ""}{e.email}
                  </div>
                </td>
                <td className="px-6 py-3">{e.jobTitle ?? "—"}</td>
                <td className="px-6 py-3">{e.department ?? "—"}</td>
                <td className="px-6 py-3">
                  {employmentTypeLabel(e.employmentType)}
                  {contractExpiringSoon(e.employmentType, e.contractEndDate) && (
                    <div className="text-xs text-amber-600">
                      expires {e.contractEndDate?.toLocaleDateString("en-GB")}
                    </div>
                  )}
                </td>
                <td className="px-6 py-3">
                  <span className={isCurrentEmployee(e.employmentStatus) ? "text-emerald-600" : "text-gray-400"}>
                    {employmentStatusLabel(e.employmentStatus)}
                  </span>
                </td>
                <td className="px-6 py-3 text-xs text-gray-500">
                  {view === "current"
                    ? e.startDate?.toLocaleDateString("en-GB") ?? "—"
                    : e.endDate?.toLocaleDateString("en-GB") ?? "—"}
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                No {view} employees{searchParams.dept ? ` in ${searchParams.dept}` : ""}.
              </td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
