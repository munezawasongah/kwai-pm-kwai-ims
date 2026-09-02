import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { roleHasCapability } from "@/lib/permissions";
import { leaveTypeLabel } from "@/lib/leave";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeaveDecision } from "@/components/hr/leave-decision";

export default async function HrLeavePage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!roleHasCapability(role, "hr:read")) redirect("/dashboard");

  const [pending, decided] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { firstName: true, lastName: true, jobTitle: true, department: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.leaveRequest.findMany({
      where: { status: { not: "PENDING" } },
      include: {
        user: { select: { firstName: true, lastName: true, department: true } },
        decidedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { decidedAt: "desc" },
      take: 40,
    }),
  ]);

  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-brand">Leave Requests</h1>
      <p className="mb-6 text-sm text-gray-500">
        {pending.length} awaiting a decision. You cannot decide your own request — another
        approver must handle it.
      </p>

      <Card className="mb-6">
        <CardHeader><h2 className="font-semibold">Awaiting decision</h2></CardHeader>
        <CardContent>
          {pending.length === 0 && <p className="text-sm text-gray-400">Nothing pending.</p>}
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="rounded border p-4">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.user.firstName} {r.user.lastName}</p>
                    <p className="text-xs text-gray-500">
                      {r.user.jobTitle ?? "—"}{r.user.department ? ` · ${r.user.department}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{leaveTypeLabel(r.type)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(r.startDate).toLocaleDateString("en-GB")} –{" "}
                      {new Date(r.endDate).toLocaleDateString("en-GB")} · {r.days} day{r.days === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                {r.reason && <p className="mb-3 text-sm text-gray-600">{r.reason}</p>}
                <LeaveDecision id={r.id} days={r.days} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold">Recent decisions</h2></CardHeader>
        <CardContent>
          {decided.length === 0 && <p className="text-sm text-gray-400">No decisions yet.</p>}
          <table className="w-full text-sm">
            <tbody>
              {decided.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{r.user.firstName} {r.user.lastName}</td>
                  <td className="py-2 pr-4">{leaveTypeLabel(r.type)}</td>
                  <td className="py-2 pr-4 text-xs text-gray-500">
                    {new Date(r.startDate).toLocaleDateString("en-GB")} · {r.days}d
                  </td>
                  <td className="py-2 pr-4"><Badge status={r.status} /></td>
                  <td className="py-2 text-xs text-gray-400">
                    {r.decidedBy ? `by ${r.decidedBy.firstName} ${r.decidedBy.lastName}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
