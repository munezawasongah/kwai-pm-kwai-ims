"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);

    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (newPassword !== confirm) {
      setError("The two new passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: form.get("currentPassword"), newPassword }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        typeof data.error === "string"
          ? data.error
          : data.error?.fieldErrors
          ? Object.values(data.error.fieldErrors).flat().join(", ")
          : "Could not change the password."
      );
      return;
    }

    setOk(true);
    e.currentTarget.reset();
  }

  return (
    <Card className="max-w-md">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
          {ok && <p className="rounded bg-emerald-50 p-2 text-sm text-emerald-700">Password changed.</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Current password</label>
            <Input name="currentPassword" type="password" required autoComplete="current-password" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">New password</label>
            <Input name="newPassword" type="password" required minLength={10} autoComplete="new-password" />
            <p className="mt-1 text-xs text-gray-400">At least 10 characters.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Confirm new password</label>
            <Input name="confirm" type="password" required minLength={10} autoComplete="new-password" />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
