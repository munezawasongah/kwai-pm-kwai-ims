"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewVehicleDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plateNumber: form.get("plateNumber"),
        make: form.get("make"),
        model: form.get("model"),
        year: Number(form.get("year")) || undefined,
        capacitySeats: Number(form.get("capacitySeats")),
        insuranceExpiry: form.get("insuranceExpiry") || undefined,
        inspectionExpiry: form.get("inspectionExpiry") || undefined,
      }),
    });

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Add Vehicle</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Add Vehicle">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Plate number</label>
            <Input name="plateNumber" required placeholder="T123 ABC" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Make</label>
              <Input name="make" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Model</label>
              <Input name="model" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Year</label>
              <Input name="year" type="number" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Seats</label>
              <Input name="capacitySeats" type="number" required min={1} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Insurance expiry</label>
              <Input name="insuranceExpiry" type="date" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Inspection expiry</label>
              <Input name="inspectionExpiry" type="date" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Vehicle"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
