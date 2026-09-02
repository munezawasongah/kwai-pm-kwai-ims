"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Activity {
  order: number;
  name: string;
  description?: string | null;
  startTime?: string | null;
}

interface Day {
  dayNumber: number;
  date?: string | null;
  title: string;
  description?: string | null;
  activities: Activity[];
}

export function ItineraryBuilder({
  itineraryId,
  initialTitle,
  initialSummary,
  initialDays,
}: {
  itineraryId: string;
  initialTitle: string;
  initialSummary: string | null;
  initialDays: Day[];
}) {
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary ?? "");
  const [days, setDays] = useState<Day[]>(initialDays.length ? initialDays : []);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  function addDay() {
    setDays((prev) => [
      ...prev,
      { dayNumber: prev.length + 1, title: "", description: "", activities: [] },
    ]);
  }

  function removeDay(index: number) {
    setDays((prev) => prev.filter((_, i) => i !== index).map((d, i) => ({ ...d, dayNumber: i + 1 })));
  }

  function updateDay(index: number, patch: Partial<Day>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function addActivity(dayIndex: number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex
          ? { ...d, activities: [...d.activities, { order: d.activities.length, name: "", startTime: "" }] }
          : d
      )
    );
  }

  function updateActivity(dayIndex: number, actIndex: number, patch: Partial<Activity>) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex
          ? { ...d, activities: d.activities.map((a, j) => (j === actIndex ? { ...a, ...patch } : a)) }
          : d
      )
    );
  }

  function removeActivity(dayIndex: number, actIndex: number) {
    setDays((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, activities: d.activities.filter((_, j) => j !== actIndex) } : d))
    );
  }

  async function handleSave() {
    setSaving(true);
    setSavedMsg(null);

    await fetch(`/api/itineraries/${itineraryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, summary }),
    });

    await fetch(`/api/itineraries/${itineraryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    });

    setSaving(false);
    setSavedMsg("Saved.");
    setTimeout(() => setSavedMsg(null), 2000);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Itinerary title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Summary</label>
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} />
      </div>

      <div className="space-y-3">
        {days.map((day, dayIndex) => (
          <div key={dayIndex} className="rounded border p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold text-brand">Day {day.dayNumber}</p>
              <button onClick={() => removeDay(dayIndex)} className="text-xs text-red-500 hover:underline">
                Remove day
              </button>
            </div>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <Input
                placeholder="Day title (e.g. Arusha → Serengeti)"
                value={day.title}
                onChange={(e) => updateDay(dayIndex, { title: e.target.value })}
              />
              <Input
                type="date"
                value={day.date ?? ""}
                onChange={(e) => updateDay(dayIndex, { date: e.target.value })}
              />
            </div>
            <Textarea
              placeholder="Day description"
              rows={2}
              value={day.description ?? ""}
              onChange={(e) => updateDay(dayIndex, { description: e.target.value })}
              className="mb-2"
            />

            <div className="space-y-2 pl-3">
              {day.activities.map((act, actIndex) => (
                <div key={actIndex} className="flex items-center gap-2">
                  <Input
                    className="w-24"
                    placeholder="08:00"
                    value={act.startTime ?? ""}
                    onChange={(e) => updateActivity(dayIndex, actIndex, { startTime: e.target.value })}
                  />
                  <Input
                    placeholder="Activity name"
                    value={act.name}
                    onChange={(e) => updateActivity(dayIndex, actIndex, { name: e.target.value })}
                  />
                  <button
                    onClick={() => removeActivity(dayIndex, actIndex)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button onClick={() => addActivity(dayIndex)} className="text-xs text-brand hover:underline">
                + Add activity
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={addDay}>
          + Add Day
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Itinerary"}
        </Button>
        {savedMsg && <span className="text-sm text-emerald-600">{savedMsg}</span>}
        <a
          href={`/api/itineraries/${itineraryId}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-sm font-medium text-brand hover:underline"
        >
          Generate branded PDF →
        </a>
      </div>
    </div>
  );
}
