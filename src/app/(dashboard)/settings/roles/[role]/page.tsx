import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  ALL_ROLES, ROLE_DESCRIPTIONS, PERMISSIONS, CAPABILITY_GROUPS,
  roleHasCapability, type AppRole,
} from "@/lib/permissions";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { AssignToRole } from "@/components/users/assign-to-role";

export default async function RolePage({ params }: { params: { role: string } }) {
  const session = await getServerSession(authOptions);
  const myRole = (session?.user as { role?: string } | undefined)?.role;
  if (!roleHasCapability(myRole, "users:read")) redirect("/dashboard");

  const role = params.role.toUpperCase() as AppRole;
  if (!ALL_ROLES.includes(role)) notFound();

  const [members, others] = await Promise.all([
    prisma.user.findMany({
      where: { role },
      orderBy: [{ isActive: "desc" }, { firstName: "asc" }],
      select: {
        id: true, firstName: true, lastName: true, email: true,
        jobTitle: true, department: true, isActive: true, role: true,
      },
    }),
    prisma.user.findMany({
      where: { role: { not: role }, isActive: true },
      orderBy: [{ department: "asc" }, { firstName: "asc" }],
      select: {
        id: true, firstName: true, lastName: true, email: true,
        jobTitle: true, department: true, role: true,
      },
    }),
  ]);

  // Capabilities this role actually holds, read from the live policy.
  const held = CAPABILITY_GROUPS.map((g) => ({
    label: g.label,
    caps: g.capabilities.filter((c) => (PERMISSIONS[c] as readonly string[]).includes(role)),
  })).filter((g) => g.caps.length > 0);

  return (
    <div className="p-8">
      <div className="mb-1 text-sm">
        <Link href="/settings/users" className="text-brand hover:underline">Staff Accounts</Link>
        <span className="text-gray-400"> / Roles</span>
      </div>
      <h1 className="mb-1 text-2xl font-bold text-brand">{role.replace(/_/g, " ")}</h1>
      <p className="mb-6 max-w-2xl text-sm text-gray-500">{ROLE_DESCRIPTIONS[role]}</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {ALL_ROLES.map((r) => (
          <Link
            key={r}
            href={`/settings/roles/${r.toLowerCase()}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              r === role ? "border-brand bg-brand text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {r.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold">
            People with this role <span className="text-gray-400">({members.length})</span>
          </h2>
        </CardHeader>
        <CardContent>
          {members.length === 0 && (
            <p className="text-sm text-gray-400">Nobody holds this role yet. Assign someone below.</p>
          )}
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className={`flex flex-wrap items-center justify-between gap-3 rounded border p-3 ${m.isActive ? "" : "opacity-50"}`}>
                <div>
                  <p className="font-medium">
                    {m.firstName} {m.lastName}
                    {!m.isActive && <span className="ml-2 text-xs text-gray-400">(deactivated)</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {m.jobTitle ?? "No designation"}{m.department ? ` · ${m.department}` : ""} · {m.email}
                  </p>
                </div>
                <AssignToRole userId={m.id} currentRole={m.role} mode="change" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold">Assign someone to this role</h2>
        </CardHeader>
        <CardContent>
          {others.length === 0 && <p className="text-sm text-gray-400">No other active staff.</p>}
          <div className="space-y-2">
            {others.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3">
                <div>
                  <p className="font-medium">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-gray-500">
                    {u.jobTitle ?? "No designation"}{u.department ? ` · ${u.department}` : ""} ·
                    currently <strong>{u.role.replace(/_/g, " ")}</strong>
                  </p>
                </div>
                <AssignToRole userId={u.id} currentRole={u.role} targetRole={role} mode="assign" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold">What this role can do</h2></CardHeader>
        <CardContent>
          {held.length === 0 ? (
            <p className="text-sm text-gray-500">
              No operational permissions. Members can sign in and manage their own account only.
            </p>
          ) : (
            <div className="space-y-3">
              {held.map((g) => (
                <div key={g.label}>
                  <p className="text-xs font-semibold uppercase text-gray-500">{g.label}</p>
                  <p className="text-sm text-gray-700">{g.caps.join(", ")}</p>
                </div>
              ))}
            </div>
          )}
          <Link href="/settings/permissions" className="mt-4 inline-block text-sm text-brand hover:underline">
            Compare all roles →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
