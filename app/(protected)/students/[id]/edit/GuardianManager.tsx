"use client";

import { useState, useTransition } from "react";
import { linkGuardian, unlinkGuardian } from "../../actions";
import { GuardianStudent, Profile } from "@/lib/types";

type GuardianRow = GuardianStudent & {
  profiles: Pick<Profile, "full_name" | "email"> | null;
};

type Props = {
  studentId: string;
  guardians: GuardianRow[];
};

export default function GuardianManager({ studentId, guardians: initial }: Props) {
  const [guardians, setGuardians] = useState(initial);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("guardian_email", email);
    startTransition(async () => {
      const result = await linkGuardian(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setEmail("");
        // Reload to get fresh guardian list
        window.location.reload();
      }
    });
  }

  function handleUnlink(guardianStudentId: string) {
    setError(null);
    const formData = new FormData();
    formData.set("guardian_student_id", guardianStudentId);
    formData.set("student_id", studentId);
    startTransition(async () => {
      const result = await unlinkGuardian(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setGuardians((prev) => prev.filter((g) => g.id !== guardianStudentId));
      }
    });
  }

  return (
    <div className="mt-3 space-y-3">
      {guardians.length === 0 ? (
        <p className="text-sm text-slate-500">No guardians linked.</p>
      ) : (
        <ul className="space-y-2">
          {guardians.map((g) => (
            <li key={g.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5">
              <div>
                <p className="text-sm font-medium text-slate-900">{g.profiles?.full_name ?? "Unknown"}</p>
                <p className="text-xs text-slate-500">{g.profiles?.email}</p>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleUnlink(g.id)}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleLink} className="flex items-center gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Guardian email address"
          required
          className="input max-w-xs"
        />
        <button type="submit" disabled={isPending} className="btn-secondary">
          {isPending ? "Linking…" : "Link guardian"}
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
