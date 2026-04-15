"use client";

import { useState, useTransition } from "react";
import { deleteClass } from "../actions";

export default function DeleteClassButton({ classId }: { classId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    const formData = new FormData();
    formData.set("class_id", classId);
    startTransition(async () => {
      const result = await deleteClass(formData);
      if (result?.error) setError(result.error);
    });
  }

  if (!confirm) {
    return (
      <button type="button" onClick={() => setConfirm(true)} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50">
        Delete
      </button>
    );
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-3">
      <p className="text-xs text-red-700">
        This will permanently delete the class and all its enrollments, attendance records, and assessments.
      </p>
      {error && <p className="mt-1 form-error">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="btn-danger btn-sm"
        >
          {isPending ? "Deleting…" : "Yes, delete permanently"}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="btn-secondary btn-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
