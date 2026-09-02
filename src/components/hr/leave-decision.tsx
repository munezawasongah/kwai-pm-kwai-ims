"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LeaveDecision({ id, days }: { id: string; days: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjusted, setAdjusted] = useState(days);
  const [note, setNote] = useState("");

  async function decide(status: "APPROVED" | "REJECTED") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/leave/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, decisionNote: note, days: adjusted }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not save the decision.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-gray-500">Days</label>
        <Input
          type="number"
          min={1}
          value={adjusted}
          onChange={(e) => setAdjusted(Number(e.target.value))}
          className="w-16"
        />
        <Input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-44"
        />
        <Button size="sm" disabled={busy} onClick={() => decide("APPROVED")}>Approve</Button>
        <Button size="sm" variant="danger" disabled={busy} onClick={() => decide("REJECTED")}>Reject</Button>
      </div>
      <p className="text-[11px] text-gray-400">
        Adjust the day count if a public holiday falls within the period — holidays are not
        deducted automatically.
      </p>
    </div>
  );
}
