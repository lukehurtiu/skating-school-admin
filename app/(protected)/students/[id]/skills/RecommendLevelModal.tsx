"use client";

import { useState, useTransition } from "react";
import { recommendLevel } from "./actions";
import { SkatingLevel, SkatingClass } from "@/lib/types";

type Props = {
  studentId: string;
  levels: Pick<SkatingLevel, "id" | "name">[];
  instructorClasses: Pick<SkatingClass, "id" | "name">[];
};

export default function RecommendLevelModal({ studentId, levels, instructorClasses }: Props) {
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
        setError(null);
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary">
        Recommend Level
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); setError(null); } }}
        >
          <div className="card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-text-primary">Recommend next level</h2>
              <button
                type="button"
                onClick={() => { setOpen(false); setError(null); }}
                className="btn-icon"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="form-error">{error}</p>}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <div className="flex gap-2 pt-1">
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
          </div>
        </div>
      )}
    </>
  );
}
