"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function AssignVehicleForm({
  bookingId,
  vehicles,
}: {
  bookingId: string;
  vehicles: { id: string; plateNumber: string; make: string; model: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    await fetch(`/api/bookings/${bookingId}/vehicle-assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId: form.get("vehicleId"),
        startDate: form.get("startDate"),
        endDate: form.get("endDate"),
      }),
    });

    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded border p-3">
      <div>
        <label className="mb-1 block text-xs font-medium">Vehicle</label>
        <Select name="vehicleId" required className="w-56" defaultValue="">
          <option value="" disabled>
            Select vehicle
          </option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plateNumber} — {v.make} {v.model}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">Start</label>
        <Input name="startDate" type="date" required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">End</label>
        <Input name="endDate" type="date" required />
      </div>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Assigning..." : "Assign Vehicle"}
      </Button>
    </form>
  );
}

export function AssignStaffForm({
  bookingId,
  staff,
}: {
  bookingId: string;
  staff: { id: string; user: { firstName: string; lastName: string } }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notified, setNotified] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch(`/api/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffProfileId: form.get("staffProfileId"),
        bookingId,
        role: form.get("role"),
        startDate: form.get("startDate"),
        endDate: form.get("endDate"),
      }),
    });

    setLoading(false);
    const data = await res.json();
    setNotified(!!data.notified);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded border p-3">
      <div>
        <label className="mb-1 block text-xs font-medium">Driver / Guide</label>
        <Select name="staffProfileId" required className="w-56" defaultValue="">
          <option value="" disabled>
            Select staff
          </option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.user.firstName} {s.user.lastName}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">Role</label>
        <Select name="role" defaultValue="DRIVER_GUIDE">
          <option value="DRIVER">Driver</option>
          <option value="GUIDE">Guide</option>
          <option value="DRIVER_GUIDE">Driver + Guide</option>
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">Start</label>
        <Input name="startDate" type="date" required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">End</label>
        <Input name="endDate" type="date" required />
      </div>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Assigning..." : "Assign + Notify via WhatsApp"}
      </Button>
      {notified && <span className="text-xs text-emerald-600">Staff notified ✓</span>}
    </form>
  );
}
