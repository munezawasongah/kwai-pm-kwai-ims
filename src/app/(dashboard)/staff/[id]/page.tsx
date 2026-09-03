import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { roleHasCapability } from "@/lib/permissions";
import { employmentTypeLabel, employmentStatusLabel, isCurrentEmployee } from "@/lib/employment";
import { annualLeaveBalance, leaveTypeLabel } from "@/lib/leave";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmploymentEditor } from "@/components/users/employment-editor";
import { DeleteEmployee } from "@/components/users/delete-employee";

export default async function EmployeePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!roleHasCapability(role, "staff:read")) redirect("/dashboard");

  const canWrite = roleHasCapability(role, "staff:write");
  const canDelete = roleHasCapability(role, "users:write");

  const employee = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      jobTitle: true, department: true, employeeNumber: true, role: true,
      employmentType: true, employmentStatus: true, isActive: true,
      startDate: true, endDate: true, contractEndDate: true, exitReason: true,
      emergencyName: true, emergencyPhone: true, annualLeaveDays: true,
      staffProfile: { select: { licenseNumber: true, languagesSpoken: true, yearsExperience: true } },
      leaveRequests: { orderBy: { startDate: "desc" }, take: 20 },
    },
  });

  if (!employee) notFound();

  const balance = annualLeaveBalance(employee.annualLeaveDays, employee.leaveRequests);
  const current = isCurrentEmployee(employee.employmentStatus);

  return (
    <div className="space-y-6 p-8">
      <div>
        <Link href="/staff" className="text-sm text-brand hover:underline">← Employees</Link>
        <h1 className="mt-1 text-2xl font-bold text-brand">
          {employee.firstName} {employee.lastName}
        </h1>
        <p className="text-sm text-gray-500">
          {employee.jobTitle ?? "No designation"}
          {employee.department ? ` · ${employee.department}` : ""}
          {employee.employeeNumber ? ` · ${employee.employeeNumber}` : ""}
        </p>
        <p className="mt-1 text-xs">
          <span className={current ? "text-emerald-600" : "text-gray-400"}>
            {employmentStatusLabel(employee.employmentStatus)}
          </span>
          {" · "}{employmentTypeLabel(employee.employmentType)}
          {" · system access: "}{employee.role.replace(/_/g, " ")}
        </p>
      </div>

      {!current && (
        <div className="rounded border border-gray-300 bg-gray-50 p-4 text-sm">
          <p className="font-medium">Former employee</p>
          <p className="text-gray-600">
            Left on {employee.endDate?.toLocaleDateString("en-GB") ?? "an unrecorded date"}
            {employee.exitReason ? ` — ${employee.exitReason}` : ""}. Sign-in access is revoked;
            the record is retained.
          </p>
        </div>
      )}

      <Card>
        <CardHeader><h2 className="font-semibold">Contact</h2></CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p><span className="text-gray-500">Email:</span> {employee.email}</p>
          <p><span className="text-gray-500">Phone:</span> {employee.phone ?? "—"}</p>
          <p><span className="text-gray-500">Started:</span> {employee.startDate?.toLocaleDateString("en-GB") ?? "—"}</p>
          <p>
            <span className="text-gray-500">Emergency:</span>{" "}
            {employee.emergencyName ? `${employee.emergencyName} ${employee.emergencyPhone ?? ""}` : "—"}
          </p>
          {employee.staffProfile && (
            <>
              <p><span className="text-gray-500">Licence:</span> {employee.staffProfile.licenseNumber ?? "—"}</p>
              <p><span className="text-gray-500">Languages:</span> {employee.staffProfile.languagesSpoken.join(", ") || "—"}</p>
            </>
          )}
        </CardContent>
      </Card>

      {canWrite && (
        <Card>
          <CardHeader><h2 className="font-semibold">Employment</h2></CardHeader>
          <CardContent>
            <EmploymentEditor
              userId={employee.id}
              employmentType={employee.employmentType}
              employmentStatus={employee.employmentStatus}
              contractEndDate={employee.contractEndDate ? employee.contractEndDate.toISOString().slice(0, 10) : null}
              annualLeaveDays={employee.annualLeaveDays}
            />
          </CardContent>
        </Card>
      )}

      {canDelete && (
        <Card>
          <CardHeader><h2 className="font-semibold">Delete record</h2></CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-gray-500">
              Permanently removes this person and their account. Only possible if they have no
              bookings, invoices, messages or leave attached — otherwise record a departure,
              which keeps the history.
            </p>
            <DeleteEmployee
              userId={employee.id}
              fullName={`${employee.firstName} ${employee.lastName}`}
              redirectTo="/staff"
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><h2 className="font-semibold">Leave</h2></CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-4 gap-3 text-center text-sm">
            <div><p className="text-xs text-gray-500">Entitlement</p><p className="font-bold">{balance.entitlement}</p></div>
            <div><p className="text-xs text-gray-500">Taken</p><p className="font-bold">{balance.taken}</p></div>
            <div><p className="text-xs text-gray-500">Pending</p><p className="font-bold">{balance.pending}</p></div>
            <div><p className="text-xs text-gray-500">Remaining</p><p className="font-bold text-brand">{balance.remaining}</p></div>
          </div>
          {employee.leaveRequests.length === 0 && <p className="text-sm text-gray-400">No leave recorded.</p>}
          <table className="w-full text-sm">
            <tbody>
              {employee.leaveRequests.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{leaveTypeLabel(r.type)}</td>
                  <td className="py-2 pr-4 text-xs text-gray-500">
                    {r.startDate.toLocaleDateString("en-GB")} – {r.endDate.toLocaleDateString("en-GB")}
                  </td>
                  <td className="py-2 pr-4">{r.days}d</td>
                  <td className="py-2"><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
