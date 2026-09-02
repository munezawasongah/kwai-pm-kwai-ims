"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const SOURCES = ["WEBSITE", "WHATSAPP", "EMAIL", "REFERRAL", "WALK_IN", "OTA", "SOCIAL_MEDIA", "OTHER"];

export function NewClientDialog() {
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
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      email: form.get("email") || undefined,
      phone: form.get("phone"),
      nationality: form.get("nationality") || undefined,
      source: form.get("source"),
      notes: form.get("notes") || undefined,
    };

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.join(", ") ?? "Failed to create client");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Add Client</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Add New Client">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">First name</label>
              <Input name="firstName" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Last name</label>
              <Input name="lastName" required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone (E.164, e.g. +255712345678)</label>
            <Input name="phone" required placeholder="+255712345678" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input name="email" type="email" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Nationality</label>
            <Input name="nationality" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Source</label>
            <Select name="source" defaultValue="OTHER">
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <Textarea name="notes" rows={3} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Client"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
