"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ALL_ROLES } from "@/lib/permissions";

/**
 * "assign" — a one-click button moving someone into the role being viewed.
 * "change" — a dropdown for moving an existing member to some other role.
 */
export function AssignToRole({
  userId,
  currentRole,
  targetRole,
  mode,
}: {
  userId: string;
  currentRole: string;
  targetRole?: string;
  mode: "assign" | "change";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setRole(role: string) {
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    setBusy(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      // The API refuses to demote the last active administrator; surface that
      // reason rather than failing silently.
      setError(typeof data.error === "string" ? data.error : "Could not change the role.");
      return;
    }
    router.refresh();
  }

  if (mode === "assign") {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="max-w-xs text-xs text-red-600">{error}</span>}
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => setRole(targetRole!)}>
          {busy ? "Moving..." : `Move to ${targetRole!.replace(/_/g, " ")}`}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="max-w-xs text-xs text-red-600">{error}</span>}
      <label className="text-xs text-gray-500">Role</label>
      <Select
        value={currentRole}
        disabled={busy}
        onChange={(e) => setRole(e.target.value)}
        className="w-auto text-xs"
      >
        {ALL_ROLES.map((r) => (
          <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
        ))}
      </Select>
    </div>
  );
}
