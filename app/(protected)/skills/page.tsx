import { createClient } from "@/lib/supabase/server";
import { SkatingLevel, Skill } from "@/lib/types";
import { isAdmin } from "@/lib/utils";
import SkillsClient from "./SkillsClient";

type LevelWithSkills = SkatingLevel & { skills: Skill[] };

export default async function SkillsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: levels }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
    supabase
      .from("skating_levels")
      .select("*, skills(id, name, description, level_id, sort_order, created_at)")
      .order("sort_order")
      .returns<LevelWithSkills[]>(),
  ]);

  const levelsWithSortedSkills = (levels ?? []).map((level) => ({
    ...level,
    skills: [...(level.skills ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Skill Levels</h1>
          <p className="page-subtitle">
            All skating levels and their required skills.
            {isAdmin(profile?.role) ? " Admins can add, edit, and remove skills." : ""}
          </p>
        </div>
      </div>

      {levelsWithSortedSkills.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm font-medium text-slate-900">No levels defined yet</p>
          <p className="mt-1 text-sm text-slate-500">Run the seed migration to populate levels and skills.</p>
        </div>
      ) : (
        <SkillsClient
          levels={levelsWithSortedSkills}
          isAdmin={isAdmin(profile?.role)}
        />
      )}
    </div>
  );
}
