"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const CATEGORIES = [
  "DRIVER_ALLOWANCE",
  "FUEL",
  "PARK_FEES",
  "HOTEL_ACCOMMODATION",
  "FOOD",
  "VEHICLE_MAINTENANCE",
  "PERMITS",
  "GUIDE_FEE",
  "MISC",
];

export function ExpenseForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    await fetch(`/api/bookings/${bookingId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: form.get("category"),
        description: form.get("description"),
        amount: Number(form.get("amount")),
        currency: form.get("currency"),
      }),
    });

    setLoading(false);
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded border p-3">
      <div>
        <label className="mb-1 block text-xs font-medium">Category</label>
        <Select name="category" className="w-44" defaultValue="FUEL">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">Description</label>
        <Input name="description" className="w-48" placeholder="e.g. Fuel — Land Cruiser" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">Amount</label>
        <Input name="amount" type="number" step="0.01" min={0} required className="w-28" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">Currency</label>
        <Select name="currency" className="w-24" defaultValue="TZS">
          <option value="TZS">TZS</option>
          <option value="USD">USD</option>
        </Select>
      </div>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Adding..." : "Add Expense"}
      </Button>
    </form>
  );
}
