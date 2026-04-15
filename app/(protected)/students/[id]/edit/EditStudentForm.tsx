"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateStudent } from "../../actions";
import { Student, SkatingLevel } from "@/lib/types";

type Props = {
  student: Student;
  levels: SkatingLevel[];
};

export default function EditStudentForm({ student, levels }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateStudent(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
      <input type="hidden" name="student_id" value={student.id} />

      <div>
        <label htmlFor="first_name" className="label">First name</label>
        <input id="first_name" name="first_name" type="text" required defaultValue={student.first_name} className="input" />
      </div>

      <div>
        <label htmlFor="last_name" className="label">Last name</label>
        <input id="last_name" name="last_name" type="text" required defaultValue={student.last_name} className="input" />
      </div>

      <div>
        <label htmlFor="date_of_birth" className="label">Date of birth</label>
        <input id="date_of_birth" name="date_of_birth" type="date" required defaultValue={student.date_of_birth} className="input" />
      </div>

      <div>
        <label htmlFor="skating_level_id" className="label">Level</label>
        <select id="skating_level_id" name="skating_level_id" required defaultValue={student.skating_level_id} className="input">
          <option value="">Select a level</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <Link href={`/students/${student.id}/skills`} className="btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
