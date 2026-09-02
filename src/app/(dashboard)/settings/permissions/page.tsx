import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ALL_ROLES, CAPABILITY_GROUPS, PERMISSIONS, ROLE_DESCRIPTIONS, roleHasCapability } from "@/lib/permissions";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

/**
 * Renders the live permission matrix straight from src/lib/permissions.ts, so this
 * page cannot drift out of date — if the policy changes, this changes with it.
 * Visible to any signed-in user: knowing who is responsible for what is useful to
 * everyone, and reveals no data.
 */
export default async function PermissionsPage() {
  const session = await getServerSession(authOptions);
  const myRole = (session?.user as { role?: string } | undefined)?.role;
  const canManageUsers = roleHasCapability(myRole, "users:read");

  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-brand">Who can see what</h1>
      <p className="mb-6 text-sm text-gray-500">
        Your role is <strong>{myRole?.replace(/_/g, " ") ?? "unknown"}</strong>. Sections you
        cannot access are hidden from your sidebar, and the server refuses those requests
        independently — so the menu is a convenience, not the security boundary.
      </p>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_ROLES.map((r) => {
          const card = (
            <>
              <p className="text-sm font-semibold text-brand">{r.replace(/_/g, " ")}</p>
              <p className="mt-1 text-xs text-gray-500">{ROLE_DESCRIPTIONS[r]}</p>
            </>
          );
          const cls = `rounded border p-4 ${r === myRole ? "border-brand bg-brand/5" : "bg-white"}`;

          // Only administrators can manage role membership, so only they get a link.
          return canManageUsers ? (
            <Link key={r} href={`/settings/roles/${r.toLowerCase()}`} className={`${cls} transition hover:shadow-sm`}>
              {card}
            </Link>
          ) : (
            <div key={r} className={cls}>{card}</div>
          );
        })}
      </div>

      {CAPABILITY_GROUPS.map((group) => (
        <Card key={group.label} className="mb-4">
          <CardHeader><h2 className="font-semibold">{group.label}</h2></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Action</th>
                  {ALL_ROLES.map((r) => (
                    <th key={r} className="py-2 px-2 text-center">{r.replace(/_/g, " ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.capabilities.map((cap) => (
                  <tr key={cap} className="border-t">
                    <td className="py-2 pr-4 font-mono text-xs">{cap}</td>
                    {ALL_ROLES.map((r) => {
                      const allowed = (PERMISSIONS[cap] as readonly string[]).includes(r);
                      return (
                        <td key={r} className="py-2 px-2 text-center">
                          <span className={allowed ? "text-emerald-600" : "text-gray-300"}>
                            {allowed ? "✓" : "—"}
                          </span>
                        </td>
                      );
                    })}
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
