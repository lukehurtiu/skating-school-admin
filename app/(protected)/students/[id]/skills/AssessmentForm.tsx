"use client";

import { useState, useTransition } from "react";
import { submitAssessment } from "./actions";
import { AssessmentStatus, SkatingClass } from "@/lib/types";

type Props = {
  studentId: string;
  skillId: string;
  currentStatus: AssessmentStatus;
  instructorClasses: Pick<SkatingClass, "id" | "name">[];
};


export default function AssessmentForm({
  studentId,
  skillId,
  currentStatus,
  instructorClasses,
}: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toLocaleDateString("en-CA");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitAssessment(formData);
      if (result?.error) setError(result.error);
      else setOpen(false);
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="btn-secondary btn-sm min-h-[44px] px-3"
        >
          {open ? "Cancel" : "Assess"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <input type="hidden" name="student_id" value={studentId} />
          <input type="hidden" name="skill_id" value={skillId} />

          <div>
            <label className="label text-xs">Class</label>
            <select name="class_id" required className="input">
              <option value="">Select class…</option>
              {instructorClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label text-xs">Date</label>
            <input name="assessed_on" type="date" defaultValue={today} required className="input" />
          </div>

          <div>
            <label className="label text-xs">Result</label>
            <select name="status" defaultValue={currentStatus} required className="input">
              <option value="not_assessed">Not assessed</option>
              <option value="in_progress">In progress</option>
              <option value="passed">Passed</option>
            </select>
          </div>

          <div>
            <label className="label text-xs">Comment (optional)</label>
            <input
              name="comment"
              type="text"
              placeholder="Feedback or notes"
              className="input"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={isPending} className="btn-primary btn-sm">
            {isPending ? "Saving…" : "Save assessment"}
          </button>
        </form>
      )}
    </div>
  );
}
