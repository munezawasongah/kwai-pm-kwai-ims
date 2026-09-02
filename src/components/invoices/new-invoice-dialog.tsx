"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function NewInvoiceDialog({
  bookings,
}: {
  bookings: { id: string; bookingRef: string; title: string; clientId: string; currency: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);

  const selectedBooking = bookings.find((b) => b.id === bookingId);

  function updateLine(i: number, patch: Partial<LineItem>) {
    setLineItems((prev) => prev.map((li, idx) => (idx === i ? { ...li, ...patch } : li)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedBooking) return;
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body = {
      bookingId: selectedBooking.id,
      clientId: selectedBooking.clientId,
      currency: selectedBooking.currency,
      dueDate: form.get("dueDate") || undefined,
      lineItems: lineItems.filter((li) => li.description),
      discountAmount: Number(form.get("discountAmount") || 0),
      taxAmount: Number(form.get("taxAmount") || 0),
    };

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(JSON.stringify(data.error ?? "Failed to create invoice"));
      return;
    }

    const created = await res.json();
    setOpen(false);
    router.push(`/invoices/${created.id}`);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ New Invoice</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="New Invoice">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="rounded bg-red-50 p-2 text-xs text-red-600">{error}</p>}
          <div>
            <label className="mb-1 block text-sm font-medium">Booking</label>
            <Select value={bookingId} onChange={(e) => setBookingId(e.target.value)} required>
              <option value="" disabled>
                Select booking
              </option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bookingRef} — {b.title}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Line items</label>
            <div className="space-y-2">
              {lineItems.map((li, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Description"
                    value={li.description}
                    onChange={(e) => updateLine(i, { description: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={1}
                    value={li.quantity}
                    onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                    className="w-16"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={li.unitPrice}
                    onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })}
                    className="w-24"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setLineItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }])}
              className="mt-2 text-xs text-brand hover:underline"
            >
              + Add line item
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Discount</label>
              <Input name="discountAmount" type="number" step="0.01" min={0} defaultValue={0} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tax</label>
              <Input name="taxAmount" type="number" step="0.01" min={0} defaultValue={0} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Due date</label>
            <Input name="dueDate" type="date" />
          </div>

          <Button type="submit" disabled={loading || !bookingId} className="w-full">
            {loading ? "Creating..." : "Create Invoice"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
