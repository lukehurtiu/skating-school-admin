"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateClass } from "../../actions";
import { SkatingClass, Profile, SkatingLevel } from "@/lib/types";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

type Props = {
  skatingClass: SkatingClass & { skating_levels: { name: string } | null };
  instructors: Pick<Profile, "id" | "full_name">[];
  levels: SkatingLevel[];
};

export default function EditClassForm({ skatingClass, instructors, levels }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateClass(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
      <input type="hidden" name="class_id" value={skatingClass.id} />

      <div>
        <label htmlFor="name" className="label">Class name</label>
        <input id="name" name="name" type="text" required defaultValue={skatingClass.name} className="input" />
      </div>

      <div>
        <label htmlFor="day_of_week" className="label">Day</label>
        <select id="day_of_week" name="day_of_week" required defaultValue={skatingClass.day_of_week} className="input">
          {DAYS.map((d) => (
            <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="start_time" className="label">Start time</label>
          <input id="start_time" name="start_time" type="time" required defaultValue={skatingClass.start_time.slice(0, 5)} className="input" />
        </div>
        <div className="flex-1">
          <label htmlFor="end_time" className="label">End time</label>
          <input id="end_time" name="end_time" type="time" required defaultValue={skatingClass.end_time.slice(0, 5)} className="input" />
        </div>
      </div>

      <div>
        <label htmlFor="location" className="label">Location</label>
        <input id="location" name="location" type="text" required defaultValue={skatingClass.location} className="input" />
      </div>

      <div>
        <label htmlFor="skating_level_id" className="label">Level</label>
        <select id="skating_level_id" name="skating_level_id" required defaultValue={skatingClass.skating_level_id} className="input">
          <option value="">Select a level</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="instructor_id" className="label">Lead instructor</label>
        <select id="instructor_id" name="instructor_id" required defaultValue={skatingClass.instructor_id} className="input">
          <option value="">Select an instructor</option>
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>{i.full_name}</option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <Link href={`/classes/${skatingClass.id}`} className="btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
