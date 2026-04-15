"use client";

import { useState, useTransition } from "react";
import { enrollStudent } from "../actions";
import { Student } from "@/lib/types";

type Props = {
  classId: string;
  availableStudents: Pick<Student, "id" | "first_name" | "last_name">[];
};

export default function EnrollStudentForm({ classId, availableStudents }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("class_id", classId);
    startTransition(async () => {
      const result = await enrollStudent(formData);
      if (result?.error) setError(result.error);
    });
  }

  if (availableStudents.length === 0) {
    return <p className="text-sm text-slate-500">All students are enrolled in this class.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <select name="student_id" required className="input max-w-xs">
        <option value="">Select a student…</option>
        {availableStudents.map((s) => (
          <option key={s.id} value={s.id}>
            {s.first_name} {s.last_name}
          </option>
        ))}
      </select>
      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Enrolling…" : "Enroll"}
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
