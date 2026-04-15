"use client";

import { useState, useTransition, useEffect } from "react";
import { addInstructor, removeInstructor } from "./actions";
import { Profile } from "@/lib/types";

type AssignedInstructor = {
  id: string;
  instructor_id: string;
  full_name: string;
};

type Props = {
  classId: string;
  assigned: AssignedInstructor[];
  available: Pick<Profile, "id" | "full_name">[];
};

export default function InstructorManager({ classId, assigned, available }: Props) {
  const [addError, setAddError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPendingAdd, startAdd] = useTransition();
  const [isPendingRemove, startRemove] = useTransition();

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddError(null);
    const formData = new FormData(e.currentTarget);
    startAdd(async () => {
      const result = await addInstructor(formData);
      if (result?.error) setAddError(result.error);
      else {
        setSuccessMsg("Instructor added.");
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  function handleRemove(classInstructorId: string) {
    setRemoveError(null);
    const formData = new FormData();
    formData.set("class_instructor_id", classInstructorId);
    formData.set("class_id", classId);
    startRemove(async () => {
      const result = await removeInstructor(formData);
      if (result?.error) setRemoveError(result.error);
      else setSuccessMsg("Instructor removed.");
    });
  }

  return (
    <div>
      {assigned.length > 0 && (
        <ul className="mb-3 space-y-2">
          {assigned.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className="text-slate-900">{a.full_name}</span>
              <button
                type="button"
                disabled={isPendingRemove}
                onClick={() => handleRemove(a.id)}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {removeError && <p className="mb-2 form-error">{removeError}</p>}
      {successMsg && <p className="mb-2 form-success">{successMsg}</p>}

      {available.length > 0 && (
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input type="hidden" name="class_id" value={classId} />
          <select
            name="instructor_id"
            required
            className="input flex-1"
          >
            <option value="">Add instructor…</option>
            {available.map((i) => (
              <option key={i.id} value={i.id}>{i.full_name}</option>
            ))}
          </select>
          <button type="submit" disabled={isPendingAdd} className="btn-primary btn-sm">
            {isPendingAdd ? "Adding…" : "Add"}
          </button>
        </form>
      )}

      {addError && <p className="mt-2 form-error">{addError}</p>}
    </div>
  );
}
