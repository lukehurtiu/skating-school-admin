"use client";

import { useState, useTransition } from "react";
import { createSkill, updateSkill, deleteSkill } from "./actions";
import { SkatingLevel, Skill } from "@/lib/types";

type LevelWithSkills = SkatingLevel & { skills: Skill[] };

type Props = {
  levels: LevelWithSkills[];
  isAdmin: boolean;
};

export default function SkillsClient({ levels, isAdmin }: Props) {
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [addingToLevelId, setAddingToLevelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>, levelId: string) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("level_id", levelId);
    startTransition(async () => {
      const result = await createSkill(formData);
      if (result?.error) setError(result.error);
      else {
        setAddingToLevelId(null);
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateSkill(formData);
      if (result?.error) setError(result.error);
      else setEditingSkillId(null);
    });
  }

  function handleDelete(skillId: string) {
    setError(null);
    const formData = new FormData();
    formData.set("skill_id", skillId);
    startTransition(async () => {
      const result = await deleteSkill(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="mt-6 space-y-4">
      {error && <p className="form-error">{error}</p>}

      {levels.map((level) => (
        <div key={level.id} className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold text-slate-900">{level.name}</h2>
            {isAdmin && (
              <button
                type="button"
                onClick={() =>
                  setAddingToLevelId(addingToLevelId === level.id ? null : level.id)
                }
                className="text-sm text-indigo-600 hover:underline"
              >
                + Add skill
              </button>
            )}
          </div>

          <ul className="divide-y divide-slate-100">
            {level.skills.map((skill, idx) => (
              <li key={skill.id} className="px-4 py-3">
                {isAdmin && editingSkillId === skill.id ? (
                  <form onSubmit={handleUpdate} className="space-y-2">
                    <input type="hidden" name="skill_id" value={skill.id} />
                    <input
                      name="name"
                      defaultValue={skill.name}
                      required
                      className="input"
                    />
                    <input
                      name="description"
                      defaultValue={skill.description}
                      placeholder="Passing standard (optional)"
                      className="input"
                    />
                    <div className="flex gap-2">
                      <button type="submit" disabled={isPending} className="btn-primary btn-sm">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSkillId(null)}
                        className="btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-900">
                        <span className="mr-2 text-slate-400">{idx + 1}.</span>
                        {skill.name}
                      </p>
                      {skill.description && (
                        <p className="mt-0.5 text-xs text-slate-500">{skill.description}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex shrink-0 gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingSkillId(skill.id)}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(skill.id)}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}

            {isAdmin && addingToLevelId === level.id && (
              <li className="px-4 py-3">
                <form onSubmit={(e) => handleCreate(e, level.id)} className="space-y-2">
                  <input
                    name="name"
                    placeholder="Skill name"
                    required
                    autoFocus
                    className="input"
                  />
                  <input
                    name="description"
                    placeholder="Passing standard (optional)"
                    className="input"
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={isPending} className="btn-primary btn-sm">
                      {isPending ? "Adding…" : "Add skill"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingToLevelId(null)}
                      className="btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
