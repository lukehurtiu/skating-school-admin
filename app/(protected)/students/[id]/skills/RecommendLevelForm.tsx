"use client";

import { useState, useTransition } from "react";
import { recommendLevel } from "./actions";
import { SkatingLevel, SkatingClass } from "@/lib/types";

type Props = {
  studentId: string;
  levels: Pick<SkatingLevel, "id" | "name">[];
  instructorClasses: Pick<SkatingClass, "id" | "name">[];
};

export default function RecommendLevelForm({ studentId, levels, instructorClasses }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toLocaleDateString("en-CA");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("student_id", studentId);
    startTransition(async () => {
      const result = await recommendLevel(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary text-sm"
      >
        + Recommend Level
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
      <p className="text-sm font-medium text-slate-900">Recommend next level</p>

      {error && <p className="form-error">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="recommended_level_id">Recommended level</label>
          <select id="recommended_level_id" name="recommended_level_id" required className="input">
            <option value="">Select level…</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="class_id">Class</label>
          <select id="class_id" name="class_id" required className="input">
            <option value="">Select class…</option>
            {instructorClasses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="assessed_on">Date</label>
          <input
            id="assessed_on"
            name="assessed_on"
            type="date"
            defaultValue={today}
            required
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="rec_comment">Comments (optional)</label>
        <textarea
          id="rec_comment"
          name="comment"
          rows={2}
          className="input"
          placeholder="Any notes for the student or parent…"
        />
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Saving…" : "Save recommendation"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
