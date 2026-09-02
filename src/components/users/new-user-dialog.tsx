"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ALL_ROLES, ROLE_DESCRIPTIONS } from "@/lib/permissions";
import { buildStaffEmail, COMPANY_EMAIL_DOMAIN } from "@/lib/email-conventions";
import { designationsByDepartment, findDesignation } from "@/lib/designations";
import { EMPLOYMENT_TYPES } from "@/lib/employment";

function suggestPassword() {
  // Readable but not guessable — staff must be able to relay it over the phone.
  const words = ["Serengeti", "Zanzibar", "Kilimanjaro", "Ngorongoro", "Selous", "Tarangire"];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w}-${n}-Kwai`;
}

export function NewUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState("SALES_AGENT");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  // Once the admin types their own address, stop overwriting it from the name.
  const [emailEdited, setEmailEdited] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  // Once the admin picks a role by hand, stop overriding it from the designation.
  const [roleEdited, setRoleEdited] = useState(false);
  const grouped = designationsByDepartment();
  const [password, setPassword] = useState(suggestPassword());
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body = {
      email: email || buildStaffEmail(firstName, lastName),
      firstName,
      lastName,
      phone: form.get("phone") || "",
      role,
      password,
      jobTitle: jobTitle === "__other" ? customTitle : jobTitle,
      department,
      employeeNumber: form.get("employeeNumber") || "",
      employmentType: form.get("employmentType") || "PERMANENT",
      contractEndDate: form.get("contractEndDate") || undefined,
      startDate: form.get("startDate") || undefined,
      emergencyName: form.get("emergencyName") || "",
      emergencyPhone: form.get("emergencyPhone") || "",
      licenseNumber: form.get("licenseNumber") || "",
      languagesSpoken: form.get("languagesSpoken") || "",
    };

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        typeof data.error === "string"
          ? data.error
          : data.error?.fieldErrors
          ? Object.values(data.error.fieldErrors).flat().join(", ")
          : "Could not create the account."
      );
      return;
    }

    setCreated({ email: String(body.email), password });
    router.refresh();
  }

  function close() {
    setOpen(false);
    setCreated(null);
    setPassword(suggestPassword());
    setError(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setEmailEdited(false);
    setJobTitle("");
    setDepartment("");
    setCustomTitle("");
    setRoleEdited(false);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Add Staff Account</Button>
      <Dialog open={open} onClose={close} title={created ? "Account created" : "Add Staff Account"}>
        {created ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Give these details to the employee. The password is shown once — it is stored
              only as an irreversible hash, so it cannot be retrieved later. If it is lost,
              set a new one from the user list.
            </p>
            <div className="rounded border bg-gray-50 p-4 text-sm">
              <p className="mb-1"><span className="text-gray-500">Sign in at:</span> /login</p>
              <p className="mb-1"><span className="text-gray-500">Email:</span> <strong>{created.email}</strong></p>
              <p><span className="text-gray-500">Password:</span> <strong>{created.password}</strong></p>
            </div>
            <p className="text-xs text-gray-500">
              Ask them to change it after their first sign-in, from Settings &rarr; My Password.
            </p>
            <Button onClick={close} className="w-full">Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <p className="rounded bg-red-50 p-2 text-xs text-red-600">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">First name</label>
                <Input
                  required
                  value={firstName}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFirstName(v);
                    if (!emailEdited) setEmail(buildStaffEmail(v, lastName));
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Last name</label>
                <Input
                  required
                  value={lastName}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLastName(v);
                    if (!emailEdited) setEmail(buildStaffEmail(firstName, v));
                  }}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Work email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailEdited(true); }}
                placeholder={`firstname.lastname@${COMPANY_EMAIL_DOMAIN}`}
              />
              <p className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                {emailEdited ? (
                  <>
                    Edited manually.{" "}
                    <button
                      type="button"
                      className="text-brand hover:underline"
                      onClick={() => { setEmailEdited(false); setEmail(buildStaffEmail(firstName, lastName)); }}
                    >
                      Reset to firstname.lastname
                    </button>
                  </>
                ) : (
                  <>Generated from the name as firstname.lastname@{COMPANY_EMAIL_DOMAIN}</>
                )}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Phone (E.164)</label>
              <Input name="phone" placeholder="+255712345678" />
              <p className="mt-1 text-xs text-gray-400">
                Required for drivers and guides — schedule alerts are sent by WhatsApp.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Designation</label>
              <Select
                value={jobTitle}
                required
                onChange={(e) => {
                  const v = e.target.value;
                  setJobTitle(v);
                  const found = findDesignation(v);
                  if (found) {
                    setDepartment(found.department);
                    if (!roleEdited) setRole(found.suggestedRole);
                  }
                }}
              >
                <option value="" disabled>Select a job title</option>
                {Object.entries(grouped).map(([dept, items]) => (
                  <optgroup key={dept} label={dept}>
                    {items.map((d) => (
                      <option key={d.title} value={d.title}>{d.title}</option>
                    ))}
                  </optgroup>
                ))}
                <option value="__other">Other (type it in)</option>
              </Select>
              {jobTitle === "__other" && (
                <Input
                  className="mt-2"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Job title"
                  required
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Department</label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Operations" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Employment type</label>
                <Select name="employmentType" defaultValue="PERMANENT">
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Contract end (if fixed-term)</label>
                <Input name="contractEndDate" type="date" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Employee number</label>
                <Input name="employeeNumber" placeholder="KPK-014" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Start date</label>
                <Input name="startDate" type="date" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Emergency contact</label>
                <Input name="emergencyName" placeholder="Name" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Emergency phone</label>
                <Input name="emergencyPhone" placeholder="+255..." />
              </div>
            </div>

            <div className="rounded border-l-2 border-brand bg-gray-50 p-3">
              <label className="mb-1 block text-sm font-medium">System access level</label>
              <Select value={role} onChange={(e) => { setRole(e.target.value); setRoleEdited(true); }}>
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-gray-500">{ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS]}</p>
              <p className="mt-2 text-xs text-gray-400">
                This controls what they can open in this system — separate from their job
                title. Suggested from the designation; change it if they need different access.
              </p>
            </div>

            {role === "DRIVER_GUIDE" && (
              <div className="space-y-3 rounded border bg-gray-50 p-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Licence number</label>
                  <Input name="licenseNumber" placeholder="DL-TZ-00123" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Languages (comma separated)</label>
                  <Input name="languagesSpoken" placeholder="English, Swahili" />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Temporary password</label>
              <div className="flex gap-2">
                <Input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} />
                <Button type="button" variant="secondary" onClick={() => setPassword(suggestPassword())}>
                  New
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-400">Minimum 10 characters.</p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </form>
        )}
      </Dialog>
    </>
  );
}
