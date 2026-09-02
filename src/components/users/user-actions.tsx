"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ALL_ROLES } from "@/lib/permissions";

export function UserActions({
  user,
}: {
  user: { id: string; email: string; role: string; isActive: boolean };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [done, setDone] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Update failed.");
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}

      <Select
        value={user.role}
        disabled={busy}
        onChange={(e) => patch({ role: e.target.value })}
        className="w-auto text-xs"
      >
        {ALL_ROLES.map((r) => (
          <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
        ))}
      </Select>

      <Button
        size="sm"
        variant={user.isActive ? "secondary" : "primary"}
        disabled={busy}
        onClick={() => patch({ isActive: !user.isActive })}
      >
        {user.isActive ? "Deactivate" : "Reactivate"}
      </Button>

      <Button size="sm" variant="ghost" disabled={busy} onClick={() => setResetOpen(true)}>
        Reset password
      </Button>

      <Dialog
        open={resetOpen}
        onClose={() => { setResetOpen(false); setDone(false); setNewPassword(""); }}
        title={`Reset password — ${user.email}`}
      >
        {done ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Password updated. Give this to the employee:</p>
            <div className="rounded border bg-gray-50 p-3 text-sm"><strong>{newPassword}</strong></div>
            <p className="text-xs text-gray-500">
              It is not stored in readable form, so it cannot be shown again.
            </p>
            <Button className="w-full" onClick={() => { setResetOpen(false); setDone(false); setNewPassword(""); }}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Set a new password for this account. They should change it after signing in.
            </p>
            <Input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 10 characters"
              minLength={10}
            />
            <Button
              className="w-full"
              disabled={busy || newPassword.length < 10}
              onClick={async () => { if (await patch({ password: newPassword })) setDone(true); }}
            >
              {busy ? "Saving..." : "Set Password"}
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
