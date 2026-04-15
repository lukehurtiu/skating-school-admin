"use client";

import { useState, useTransition } from "react";
import { linkStudent, unlinkStudent } from "../../actions";
import { StudentLink, Profile } from "@/lib/types";

type LinkRow = StudentLink & {
  profiles: Pick<Profile, "full_name" | "email"> | null;
};

type Props = {
  studentId: string;
  links: LinkRow[];
};

export default function StudentAccountManager({ studentId, links: initial }: Props) {
  const [links, setLinks] = useState(initial);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("student_email", email);
    startTransition(async () => {
      const result = await linkStudent(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setEmail("");
        window.location.reload();
      }
    });
  }

  function handleUnlink(linkId: string) {
    setError(null);
    const formData = new FormData();
    formData.set("link_id", linkId);
    formData.set("student_id", studentId);
    startTransition(async () => {
      const result = await unlinkStudent(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setLinks((prev) => prev.filter((l) => l.id !== linkId));
      }
    });
  }

  return (
    <div className="mt-3 space-y-3">
      {links.length === 0 ? (
        <p className="text-sm text-slate-500">No student account linked.</p>
      ) : (
        <ul className="space-y-2">
          {links.map((l) => (
            <li key={l.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5">
              <div>
                <p className="text-sm font-medium text-slate-900">{l.profiles?.full_name ?? "Unknown"}</p>
                <p className="text-xs text-slate-500">{l.profiles?.email}</p>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleUnlink(l.id)}
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
          placeholder="Student account email"
          required
          className="input max-w-xs"
        />
        <button type="submit" disabled={isPending} className="btn-secondary">
          {isPending ? "Linking…" : "Link account"}
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
