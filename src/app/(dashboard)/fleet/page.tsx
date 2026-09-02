import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewVehicleDialog } from "@/components/fleet/new-vehicle-dialog";

export default async function FleetPage() {
  const vehicles = await prisma.vehicle.findMany({
    include: { assignments: { where: { endDate: { gte: new Date() } }, include: { booking: true } } },
    orderBy: { plateNumber: "asc" },
  });

  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Fleet</h1>
        <NewVehicleDialog />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((v) => {
          const insuranceSoon = v.insuranceExpiry && v.insuranceExpiry <= in30Days;
          const inspectionSoon = v.inspectionExpiry && v.inspectionExpiry <= in30Days;

          return (
            <Card key={v.id} className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold">{v.plateNumber}</p>
                <Badge status={v.status} />
              </div>
              <p className="text-sm text-gray-500">
                {v.make} {v.model} {v.year ? `(${v.year})` : ""} · {v.capacitySeats} seats
              </p>

              {(insuranceSoon || inspectionSoon) && (
                <div className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-700">
                  {insuranceSoon && <p>⚠ Insurance expires {v.insuranceExpiry?.toLocaleDateString()}</p>}
                  {inspectionSoon && <p>⚠ Inspection expires {v.inspectionExpiry?.toLocaleDateString()}</p>}
                </div>
              )}

              {v.assignments.length > 0 && (
                <div className="mt-3 border-t pt-2 text-xs text-gray-500">
                  On trip: {v.assignments[0].booking.bookingRef} until{" "}
                  {new Date(v.assignments[0].endDate).toLocaleDateString()}
                </div>
              )}
            </Card>
          );
        })}
        {vehicles.length === 0 && <p className="text-gray-400">No vehicles registered yet.</p>}
      </div>
    </div>
  );
}
