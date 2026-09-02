"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const METHODS = ["MPESA", "TIGO_PESA", "AIRTEL_MONEY", "BANK_TRANSFER", "CASH", "CARD", "OTHER"];

export function RecordPaymentDialog({ invoiceId, currency }: { invoiceId: string; currency: string }) {
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
      type: form.get("type"),
      method: form.get("method"),
      currency,
      amount: Number(form.get("amount")),
      reference: form.get("reference") || undefined,
    };

    const res = await fetch(`/api/invoices/${invoiceId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(JSON.stringify(data.error ?? "Failed to record payment"));
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Record Payment</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Record Payment">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="rounded bg-red-50 p-2 text-xs text-red-600">{error}</p>}
          <p className="text-xs text-gray-500">
            Recording the first payment on a Quoted/Inquiry booking automatically confirms it and sends the
            WhatsApp + email booking confirmation, plus schedules pre-arrival and post-trip reminders.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium">Payment type</label>
            <Select name="type" defaultValue="DEPOSIT">
              <option value="DEPOSIT">Deposit</option>
              <option value="BALANCE">Balance</option>
              <option value="FULL">Full payment</option>
              <option value="REFUND">Refund</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Method</label>
            <Select name="method" defaultValue="MPESA">
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Amount ({currency})</label>
            <Input name="amount" type="number" step="0.01" min={0} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Reference (transaction code)</label>
            <Input name="reference" placeholder="e.g. M-Pesa code QAB1CD2E" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Recording..." : "Record Payment"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
