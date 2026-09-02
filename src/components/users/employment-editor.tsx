"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { EMPLOYMENT_TYPES, FORMER_STATUSES, isCurrentEmployee } from "@/lib/employment";

export function EmploymentEditor({
  userId,
  employmentType,
  employmentStatus,
  contractEndDate,
  annualLeaveDays,
}: {
  userId: string;
  employmentType: string;
  employmentStatus: string;
  contractEndDate: string | null;
  annualLeaveDays: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [offboardOpen, setOffboardOpen] = useState(false);

  const [type, setType] = useState(employmentType);
  const [contractEnd, setContractEnd] = useState(contractEndDate ?? "");
  const [leaveDays, setLeaveDays] = useState(annualLeaveDays);

  const [exitStatus, setExitStatus] = useState<string>("RESIGNED");
  const [exitDate, setExitDate] = useState("");
  const [exitReason, setExitReason] = useState("");

  async function patch(body: Record<string, unknown>) {
    setBusy(true); setError(null); setSaved(false);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not save.");
      return false;
    }
    router.refresh();
    return true;
  }

  const current = isCurrentEmployee(employmentStatus);

  return (
    <div className="space-y-4">
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
      {saved && <p className="rounded bg-emerald-50 p-2 text-sm text-emerald-700">Saved.</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Employment type</label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-gray-400">
            {EMPLOYMENT_TYPES.find((t) => t.value === type)?.note}
          </p>
        </div>

        {type === "FIXED_TERM_CONTRACT" && (
          <div>
            <label className="mb-1 block text-sm font-medium">Contract ends</label>
            <Input type="date" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} />
            <p className="mt-1 text-xs text-gray-400">Flagged 30 days before expiry.</p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Annual leave days</label>
          <Input
            type="number"
            min={0}
            value={leaveDays}
            onChange={(e) => setLeaveDays(Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-gray-400">Statutory minimum is 28 in Tanzania.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={busy}
          onClick={async () => {
            const ok = await patch({
              employmentType: type,
              contractEndDate: type === "FIXED_TERM_CONTRACT" ? contractEnd || null : null,
              annualLeaveDays: leaveDays,
            });
            if (ok) setSaved(true);
          }}
        >
          {busy ? "Saving..." : "Save employment details"}
        </Button>

        {current ? (
          <Button variant="danger" disabled={busy} onClick={() => setOffboardOpen(true)}>
            Record departure
          </Button>
        ) : (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => patch({ employmentStatus: "ACTIVE", endDate: null, exitReason: null, isActive: true })}
          >
            Reinstate employee
          </Button>
        )}
      </div>

      <Dialog open={offboardOpen} onClose={() => setOffboardOpen(false)} title="Record departure">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            This moves the employee to Former and revokes their sign-in access. The record itself
            is kept — their bookings, expenses and leave history reference it, and payroll and
            labour-law obligations outlast the employment.
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium">Reason for leaving</label>
            <Select value={exitStatus} onChange={(e) => setExitStatus(e.target.value)}>
              {FORMER_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ").toLowerCase()}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Last working day</label>
            <Input type="date" value={exitDate} onChange={(e) => setExitDate(e.target.value)} required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <Textarea rows={2} value={exitReason} onChange={(e) => setExitReason(e.target.value)} />
          </div>

          <Button
            variant="danger"
            className="w-full"
            disabled={busy || !exitDate}
            onClick={async () => {
              const ok = await patch({
                employmentStatus: exitStatus,
                endDate: exitDate,
                exitReason: exitReason || null,
              });
              if (ok) setOffboardOpen(false);
            }}
          >
            {busy ? "Saving..." : "Record departure"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
