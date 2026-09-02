import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export default async function StaffPage() {
  const staff = await prisma.staffProfile.findMany({
    include: {
      user: true,
      assignments: {
        where: { endDate: { gte: new Date() } },
        include: { booking: true },
        orderBy: { startDate: "asc" },
      },
    },
  });

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-brand">Drivers & Guides</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staff.map((s) => (
          <Card key={s.id} className="p-5">
            <p className="font-semibold">
              {s.user.firstName} {s.user.lastName}
            </p>
            <p className="text-sm text-gray-500">
              {s.user.phone} · {s.languagesSpoken.join(", ") || "—"}
            </p>
            {s.licenseNumber && <p className="text-xs text-gray-400">License: {s.licenseNumber}</p>}

            <div className="mt-3 border-t pt-2">
              <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Upcoming Assignments</p>
              {s.assignments.length === 0 && <p className="text-xs text-gray-400">None scheduled</p>}
              {s.assignments.map((a) => (
                <p key={a.id} className="text-xs">
                  {a.booking.bookingRef} — {new Date(a.startDate).toLocaleDateString()} to{" "}
                  {new Date(a.endDate).toLocaleDateString()} {a.notified ? "✓" : "(pending notify)"}
                </p>
              ))}
            </div>
          </Card>
        ))}
        {staff.length === 0 && <p className="text-gray-400">No staff profiles yet.</p>}
      </div>
    </div>
  );
}
