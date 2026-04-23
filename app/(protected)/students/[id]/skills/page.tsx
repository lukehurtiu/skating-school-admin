import { createClient } from "@/lib/supabase/server";
import {
  Student,
  SkatingLevel,
  Skill,
  SkillAssessment,
  SkatingClass,
  AssessmentStatus,
  LevelAdvancementRecommendation,
} from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import LevelBadge from "@/components/LevelBadge";
import ProgressBar from "@/components/ProgressBar";
import AvatarInitials from "@/components/AvatarInitials";
import SkillsAccordion from "./SkillsAccordion";
import RecommendLevelModal from "./RecommendLevelModal";

type StudentWithLevel = Student & {
  skating_levels: { name: string } | null;
};

type LevelWithSkills = SkatingLevel & { skills: Skill[] };

type RecommendationWithJoins = LevelAdvancementRecommendation & {
  skating_levels: { name: string } | null;
  profiles: { full_name: string } | null;
};

export default async function StudentSkillsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { success?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: student },
    { data: profile },
    { data: levels },
    { data: assessments },
    { data: primaryClasses },
    { data: secondaryRows },
    { data: recommendations },
  ] = await Promise.all([
    supabase
      .from("students")
      .select("*, skating_levels(name)")
      .eq("id", params.id)
      .single<StudentWithLevel>(),
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
    supabase
      .from("skating_levels")
      .select("*, skills(id, name, description, level_id, sort_order, created_at)")
      .order("sort_order")
      .returns<LevelWithSkills[]>(),
    supabase
      .from("skill_assessments")
      .select("*")
      .eq("student_id", params.id)
      .order("assessed_at", { ascending: false })
      .returns<SkillAssessment[]>(),
    supabase
      .from("classes")
      .select("id, name")
      .eq("instructor_id", user!.id)
      .returns<Pick<SkatingClass, "id" | "name">[]>(),
    supabase
      .from("class_instructors")
      .select("classes(id, name)")
      .eq("instructor_id", user!.id)
      .returns<{ classes: Pick<SkatingClass, "id" | "name"> }[]>(),
    supabase
      .from("level_advancement_recommendations")
      .select("*, skating_levels(name), profiles(full_name)")
      .eq("student_id", params.id)
      .order("created_at", { ascending: false })
      .returns<RecommendationWithJoins[]>(),
  ]);

  if (!student) notFound();

  const latestBySkillRaw = new Map<string, SkillAssessment>();
  for (const a of assessments ?? []) {
    if (!latestBySkillRaw.has(a.skill_id)) latestBySkillRaw.set(a.skill_id, a);
  }

  const seen = new Set<string>();
  const instructorClasses: Pick<SkatingClass, "id" | "name">[] = [];
  for (const c of [
    ...(primaryClasses ?? []),
    ...(secondaryRows ?? []).map((r) => r.classes).filter(Boolean),
  ] as Pick<SkatingClass, "id" | "name">[]) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      instructorClasses.push(c);
    }
  }

  const canAssess = profile?.role === "admin" || profile?.role === "instructor";

  const levelsWithSortedSkills = (levels ?? []).map((level) => ({
    ...level,
    skills: [...(level.skills ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }));

  const totalSkills = levelsWithSortedSkills.reduce((sum, l) => sum + l.skills.length, 0);
  let passedCount = 0;
  latestBySkillRaw.forEach((a) => { if (a.status === "passed") passedCount++; });

  // Serialize map to plain object for client component
  const latestBySkill: Record<string, { status: AssessmentStatus; assessed_on?: string; comment?: string }> = {};
  latestBySkillRaw.forEach((a, skillId) => {
    latestBySkill[skillId] = {
      status: a.status,
      assessed_on: a.assessed_on,
      comment: a.comment ?? undefined,
    };
  });

  const latestRecommendation = (recommendations ?? [])[0] ?? null;

  return (
    <div>
      <Link href="/students" className="back-link">← Back to students</Link>

      {searchParams.success && (
        <p className="form-success mt-3">Changes saved successfully.</p>
      )}

      {/* Page header */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <AvatarInitials name={`${student.first_name} ${student.last_name}`} size="md" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="page-title">{student.first_name} {student.last_name}</h1>
              {student.skating_levels?.name && (
                <LevelBadge levelName={student.skating_levels.name} />
              )}
            </div>
            <p className="page-subtitle mt-0.5">
              {passedCount} / {totalSkills} skills passed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canAssess && (
            <RecommendLevelModal
              studentId={params.id}
              levels={(levels ?? []).map((l) => ({ id: l.id, name: l.name }))}
              instructorClasses={instructorClasses}
            />
          )}
          {profile?.role === "admin" && (
            <Link href={`/students/${params.id}/edit`} className="btn-secondary">Edit</Link>
          )}
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mt-4">
        <ProgressBar current={passedCount} total={totalSkills} size="md" />
      </div>

      {/* Latest recommendation */}
      {latestRecommendation && (
        <div className="mt-5 rounded-card border border-ice-200 bg-ice-50 px-4 py-3">
          <p className="text-sm font-medium text-ice-900">
            Recommended for {latestRecommendation.skating_levels?.name}
            <span className="ml-2 font-normal text-ice-600 text-xs">
              {latestRecommendation.assessed_on} · by {latestRecommendation.profiles?.full_name}
            </span>
          </p>
          {latestRecommendation.comment && (
            <p className="mt-1 text-xs italic text-ice-700">&ldquo;{latestRecommendation.comment}&rdquo;</p>
          )}
        </div>
      )}

      {/* Skills accordion */}
      <div className="mt-6">
        <h2 className="section-title mb-3">Skills by Level</h2>
        <SkillsAccordion
          levels={levelsWithSortedSkills}
          studentLevelId={student.skating_level_id}
          latestBySkill={latestBySkill}
          canAssess={canAssess}
          instructorClasses={instructorClasses}
          studentId={params.id}
        />
      </div>

      {/* Level history */}
      <div className="mt-8">
        <h2 className="section-title mb-3">Level History</h2>
        {(recommendations ?? []).length === 0 ? (
          <p className="text-sm text-text-muted">No level recommendations yet.</p>
        ) : (
          <div className="card divide-y divide-slate-100">
            {(recommendations ?? []).map((rec) => (
              <div key={rec.id} className="card-row">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {rec.skating_levels?.name}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {rec.assessed_on} · {rec.profiles?.full_name}
                  </p>
                  {rec.comment && (
                    <p className="text-xs italic text-text-muted mt-0.5">&ldquo;{rec.comment}&rdquo;</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
