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
        recorded a payment or changed a booking.{" "}
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
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Role &amp; actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={`border-b last:border-0 ${u.isActive ? "" : "opacity-50"}`}>
                <td className="px-6 py-3 font-medium">{u.firstName} {u.lastName}</td>
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

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(ROLE_DESCRIPTIONS).map(([r, desc]) => (
          <div key={r} className="rounded border bg-white p-4">
            <p className="text-sm font-semibold text-brand">{r.replace(/_/g, " ")}</p>
            <p className="mt-1 text-xs text-gray-500">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
