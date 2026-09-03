"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Permanent deletion, for correcting mistakes and clearing test accounts.
 * Requires the employee's full name to be typed, because this cannot be undone
 * and a stray click on the wrong row is otherwise easy.
 */
export function DeleteEmployee({
  userId,
  fullName,
  redirectTo,
}: {
  userId: string;
  fullName: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = confirmText.trim().toLowerCase() === fullName.trim().toLowerCase();

  async function remove() {
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    setBusy(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Could not delete this account.");
      return;
    }

    setOpen(false);
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="danger" onClick={() => setOpen(true)}>
        Delete permanently
      </Button>

      <Dialog open={open} onClose={() => { setOpen(false); setError(null); setConfirmText(""); }} title="Delete employee record">
        <div className="space-y-3">
          {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <p className="text-sm text-gray-600">
            This permanently removes <strong>{fullName}</strong> and their account. It cannot be
            undone.
          </p>
          <p className="text-sm text-gray-600">
            If this person actually worked here, use <strong>Record departure</strong> instead —
            it revokes access while keeping their bookings, expenses and leave history. Deletion
            is for mistakes and test accounts.
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Type <span className="font-mono">{fullName}</span> to confirm
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={fullName}
              autoComplete="off"
            />
          </div>

          <Button variant="danger" className="w-full" disabled={busy || !matches} onClick={remove}>
            {busy ? "Deleting..." : "Delete permanently"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
