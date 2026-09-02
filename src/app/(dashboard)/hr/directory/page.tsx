import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { roleHasCapability } from "@/lib/permissions";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

/**
 * Staff directory, grouped by department. Visible to every signed-in employee —
 * knowing who your colleagues are is not sensitive. Personnel details beyond name,
 * title and work contact are shown only to HR and management.
 */
export default async function DirectoryPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!roleHasCapability(role, "directory:read")) redirect("/dashboard");

  const canSeePersonnel = roleHasCapability(role, "hr:read");

  const staff = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: [{ department: "asc" }, { firstName: "asc" }],
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      jobTitle: true, department: true, role: true,
      ...(canSeePersonnel && {
        employeeNumber: true, startDate: true,
        emergencyName: true, emergencyPhone: true, annualLeaveDays: true,
      }),
    },
  });

  const grouped = staff.reduce<Record<string, typeof staff>>((acc, s) => {
    const dept = s.department || "Unassigned";
    (acc[dept] ||= []).push(s);
    return acc;
  }, {});

  const departments = Object.keys(grouped).sort();

  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-brand">Staff Directory</h1>
      <p className="mb-6 text-sm text-gray-500">
        {staff.length} active staff across {departments.length} department
        {departments.length === 1 ? "" : "s"}.
        {canSeePersonnel ? " You can see personnel details because of your role." : ""}
      </p>

      {departments.map((dept) => (
        <Card key={dept} className="mb-4">
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold">{dept}</h2>
            <span className="text-xs text-gray-400">{grouped[dept].length} people</span>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Designation</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Phone</th>
                  {canSeePersonnel && <th className="py-2 pr-4">Emp. no.</th>}
                  {canSeePersonnel && <th className="py-2 pr-4">Started</th>}
                  {canSeePersonnel && <th className="py-2 pr-4">Emergency contact</th>}
                </tr>
              </thead>
              <tbody>
                {grouped[dept].map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="py-2 pr-4 font-medium">{s.firstName} {s.lastName}</td>
                    <td className="py-2 pr-4">{s.jobTitle ?? "—"}</td>
                    <td className="py-2 pr-4">{s.email}</td>
                    <td className="py-2 pr-4">{s.phone ?? "—"}</td>
                    {canSeePersonnel && <td className="py-2 pr-4">{(s as any).employeeNumber ?? "—"}</td>}
                    {canSeePersonnel && (
                      <td className="py-2 pr-4">
                        {(s as any).startDate ? new Date((s as any).startDate).toLocaleDateString("en-GB") : "—"}
                      </td>
                    )}
                    {canSeePersonnel && (
                      <td className="py-2 pr-4">
                        {(s as any).emergencyName
                          ? `${(s as any).emergencyName} ${(s as any).emergencyPhone ?? ""}`
                          : "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
