import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { annualLeaveBalance, leaveTypeLabel } from "@/lib/leave";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestLeaveDialog } from "@/components/hr/request-leave-dialog";

export default async function MyLeavePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { annualLeaveDays: true },
  });

  const requests = await prisma.leaveRequest.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
  });

  const balance = annualLeaveBalance(user.annualLeaveDays, requests);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">My Leave</h1>
        <RequestLeaveDialog remaining={balance.remaining} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Entitlement", value: balance.entitlement },
          { label: "Taken", value: balance.taken },
          { label: "Pending", value: balance.pending },
          { label: "Remaining", value: balance.remaining },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent>
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className="mt-1 text-2xl font-bold text-brand">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mb-6 text-xs text-gray-400">
        Annual leave days only. Sick, maternity, paternity, compassionate, study and unpaid
        leave are recorded but do not reduce this balance.
      </p>

      <Card>
        <CardHeader><h2 className="font-semibold">My requests</h2></CardHeader>
        <CardContent>
          {requests.length === 0 && <p className="text-sm text-gray-400">No requests yet.</p>}
          <table className="w-full text-sm">
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{leaveTypeLabel(r.type)}</td>
                  <td className="py-2 pr-4 text-xs text-gray-500">
                    {new Date(r.startDate).toLocaleDateString("en-GB")} –{" "}
                    {new Date(r.endDate).toLocaleDateString("en-GB")}
                  </td>
                  <td className="py-2 pr-4">{r.days}d</td>
                  <td className="py-2 pr-4"><Badge status={r.status} /></td>
                  <td className="py-2 text-xs text-gray-400">{r.decisionNote ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
