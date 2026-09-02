import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { roleHasCapability, ROLE_DESCRIPTIONS } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { NewUserDialog } from "@/components/users/new-user-dialog";
import { UserActions } from "@/components/users/user-actions";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  // Page-level guard in addition to the API guard. Neither replaces the other.
  if (!roleHasCapability(role, "users:read")) redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { firstName: "asc" }],
    select: {
      id: true, email: true, firstName: true, lastName: true,
      phone: true, role: true, isActive: true, createdAt: true,
      jobTitle: true, department: true, employeeNumber: true, startDate: true,
    },
  });

  return (
    <div className="p-8">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Staff Accounts</h1>
        <NewUserDialog />
      </div>
      <p className="mb-6 text-sm text-gray-500">
        Each employee needs their own account — shared logins make it impossible to tell who
        recorded a payment or changed a booking. <strong>Designation</strong> is the person&apos;s
        job in the company; <strong>system access</strong> is what the software lets them open.
        The two are set separately.{" "}
        <Link href="/settings/permissions" className="text-brand hover:underline">
          See what each role can access
        </Link>
        .
      </p>

      <Card>
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Designation</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">System access &amp; actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={`border-b last:border-0 ${u.isActive ? "" : "opacity-50"}`}>
                <td className="px-6 py-3">
                  <div className="font-medium">{u.firstName} {u.lastName}</div>
                  {u.employeeNumber && (
                    <div className="text-xs text-gray-400">{u.employeeNumber}</div>
                  )}
                </td>
                <td className="px-6 py-3">
                  <div>{u.jobTitle ?? "—"}</div>
                  {u.department && <div className="text-xs text-gray-400">{u.department}</div>}
                </td>
                <td className="px-6 py-3">{u.email}</td>
                <td className="px-6 py-3">{u.phone ?? "—"}</td>
                <td className="px-6 py-3">
                  <span className={u.isActive ? "text-emerald-600" : "text-gray-400"}>
                    {u.isActive ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <UserActions user={{ id: u.id, email: u.email, role: u.role, isActive: u.isActive }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <h2 className="mb-2 mt-8 text-lg font-semibold text-brand">Access levels</h2>
      <p className="mb-3 text-sm text-gray-500">
        Click a role to see who holds it and assign staff to it.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(ROLE_DESCRIPTIONS).map(([r, desc]) => (
          <Link
            key={r}
            href={`/settings/roles/${r.toLowerCase()}`}
            className="rounded border bg-white p-4 transition hover:border-brand hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-brand">{r.replace(/_/g, " ")}</p>
              <span className="text-xs text-gray-400">
                {users.filter((u) => u.role === r).length} &rarr;
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
