"use client";

import { useState, useTransition } from "react";
import { createSkill, updateSkill, deleteSkill, createLevel } from "./actions";
import { SkatingLevel, Skill } from "@/lib/types";

type LevelWithSkills = SkatingLevel & { skills: Skill[] };

type Props = {
  levels: LevelWithSkills[];
  isAdmin: boolean;
};

function PencilIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function ChevronDown({ rotated }: { rotated: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-text-muted transition-transform ${rotated ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function SkillsClient({ levels, isAdmin }: Props) {
  const [openLevels, setOpenLevels] = useState<Set<string>>(new Set());
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [addingToLevelId, setAddingToLevelId] = useState<string | null>(null);
  const [addingLevel, setAddingLevel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleLevel(levelId: string) {
    setOpenLevels((prev) => {
      const next = new Set(prev);
      if (next.has(levelId)) next.delete(levelId);
      else next.add(levelId);
      return next;
    });
  }

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
    if (!confirm("Delete this skill? This cannot be undone.")) return;
    setError(null);
    const formData = new FormData();
    formData.set("skill_id", skillId);
    startTransition(async () => {
      const result = await deleteSkill(formData);
      if (result?.error) setError(result.error);
    });
  }

  function handleCreateLevel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createLevel(formData);
      if (result?.error) setError(result.error);
      else {
        setAddingLevel(false);
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  return (
    <div className="mt-6 space-y-2">
      {error && <p className="form-error">{error}</p>}

      {levels.map((level) => {
        const isOpen = openLevels.has(level.id);

        return (
          <div key={level.id} className="card overflow-hidden">
            {/* Level accordion header */}
            <button
              type="button"
              onClick={() => toggleLevel(level.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm text-text-primary">{level.name}</span>
                <span className="text-xs text-text-muted">
                  {level.skills.length} skill{level.skills.length !== 1 ? "s" : ""}
                </span>
              </div>
              <ChevronDown rotated={isOpen} />
            </button>

            {/* Expanded skills */}
            {isOpen && (
              <div className="border-t border-slate-100">
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
                            autoFocus
                          />
                          <input
                            name="description"
                            defaultValue={skill.description}
                            placeholder="Passing standard (optional)"
                            className="input"
                          />
                          <div className="flex gap-2">
                            <button type="submit" disabled={isPending} className="btn-primary btn-sm">
                              {isPending ? "Saving…" : "Save"}
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
                            <p className="text-sm text-text-primary">
                              <span className="mr-2 text-xs text-text-muted">{idx + 1}.</span>
                              {skill.name}
                            </p>
                            {skill.description && (
                              <p className="mt-0.5 text-xs text-text-muted">{skill.description}</p>
                            )}
                          </div>
                          {isAdmin && (
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                title="Edit skill"
                                onClick={() => setEditingSkillId(skill.id)}
                                className="btn-icon"
                              >
                                <PencilIcon />
                              </button>
                              <button
                                type="button"
                                title="Delete skill"
                                disabled={isPending}
                                onClick={() => handleDelete(skill.id)}
                                className="btn-icon-danger"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}

                  {/* Add skill form */}
                  {isAdmin && addingToLevelId === level.id && (
                    <li className="px-4 py-3 bg-surface">
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

                {/* + Add skill button */}
                {isAdmin && addingToLevelId !== level.id && (
                  <div className="px-4 py-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setAddingToLevelId(level.id)}
                      className="btn-ghost text-ice-600 hover:text-ice-700 text-xs font-medium"
                    >
                      + Add skill
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add Level */}
      {isAdmin && (
        <div className="mt-4">
          {addingLevel ? (
            <form onSubmit={handleCreateLevel} className="card p-4 space-y-3">
              <p className="text-sm font-medium text-text-primary">New level</p>
              <input
                name="name"
                placeholder="Level name (e.g. Level 6)"
                required
                autoFocus
                className="input"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={isPending} className="btn-primary btn-sm">
                  {isPending ? "Adding…" : "Add level"}
                </button>
                <button
                  type="button"
                  onClick={() => setAddingLevel(false)}
                  className="btn-secondary btn-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingLevel(true)}
              className="btn-secondary"
            >
              + Add Level
            </button>
          )}
        </div>
      )}
    </div>
  );
}
