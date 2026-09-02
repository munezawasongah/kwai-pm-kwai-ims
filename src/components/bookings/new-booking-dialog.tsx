"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const TRIP_TYPES = ["SAFARI", "ZANZIBAR_BEACH", "KILIMANJARO", "CITY_TOUR", "AIRPORT_TRANSFER", "CAR_RENTAL", "CROSS_BORDER", "CUSTOM"];

export function NewBookingDialog({ clients }: { clients: { id: string; firstName: string; lastName: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body = {
      clientId: form.get("clientId"),
      tripType: form.get("tripType"),
      title: form.get("title"),
      startDate: form.get("startDate") || undefined,
      endDate: form.get("endDate") || undefined,
      numAdults: Number(form.get("numAdults") || 1),
      numChildren: Number(form.get("numChildren") || 0),
      currency: form.get("currency"),
      quotedTotal: form.get("quotedTotal") ? Number(form.get("quotedTotal")) : undefined,
    };

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(JSON.stringify(data.error ?? "Failed to create booking"));
      return;
    }

    const created = await res.json();
    setOpen(false);
    router.push(`/bookings/${created.id}`);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ New Booking</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="New Booking">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="rounded bg-red-50 p-2 text-xs text-red-600">{error}</p>}
          <div>
            <label className="mb-1 block text-sm font-medium">Client</label>
            <Select name="clientId" required defaultValue="">
              <option value="" disabled>
                Select a client
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Trip title</label>
            <Input name="title" required placeholder="7-Day Northern Circuit Safari" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Trip type</label>
            <Select name="tripType" required defaultValue="SAFARI">
              {TRIP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Start date</label>
              <Input name="startDate" type="date" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">End date</label>
              <Input name="endDate" type="date" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Adults</label>
              <Input name="numAdults" type="number" min={1} defaultValue={1} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Children</label>
              <Input name="numChildren" type="number" min={0} defaultValue={0} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Currency</label>
              <Select name="currency" defaultValue="USD">
                <option value="USD">USD</option>
                <option value="TZS">TZS</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Quoted total (optional)</label>
            <Input name="quotedTotal" type="number" step="0.01" min={0} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Booking"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
