"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LEAVE_TYPES, countWorkingDays } from "@/lib/leave";

export function RequestLeaveDialog({ remaining }: { remaining: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState("ANNUAL");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const days = start && end ? countWorkingDays(new Date(start), new Date(end)) : 0;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, startDate: start, endDate: end, reason: form.get("reason") || "" }),
    });

    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not submit the request.");
      return;
    }
    setOpen(false);
    setStart(""); setEnd("");
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Request Leave</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Request Leave">
        <form onSubmit={submit} className="space-y-3">
          {error && <p className="rounded bg-red-50 p-2 text-xs text-red-600">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
            {type === "ANNUAL" && (
              <p className="mt-1 text-xs text-gray-500">{remaining} day(s) remaining this cycle.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">From</label>
              <Input type="date" required value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">To</label>
              <Input type="date" required value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>

          {days > 0 && (
            <p className="rounded bg-gray-50 p-2 text-sm">
              <strong>{days}</strong> working day{days === 1 ? "" : "s"} (weekends excluded).
            </p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Reason</label>
            <Textarea name="reason" rows={2} />
          </div>

          <Button type="submit" disabled={busy || days === 0} className="w-full">
            {busy ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
