import { createClient } from "@/lib/supabase/server";
import { SkatingClass, Student, Profile } from "@/lib/types";
import { isAdmin } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import EnrollStudentForm from "./EnrollStudentForm";
import InstructorManager from "./InstructorManager";
import LevelBadge from "@/components/LevelBadge";
import AvatarInitials from "@/components/AvatarInitials";
import ProgressBar from "@/components/ProgressBar";
import EmptyState from "@/components/EmptyState";
import { unenrollStudent } from "../actions";

type ClassWithJoins = SkatingClass & {
  profiles: { full_name: string } | null;
  skating_levels: { id: string; name: string } | null;
};

type EnrollmentWithStudent = {
  id: string;
  student_id: string;
  students: Pick<Student, "first_name" | "last_name"> & {
    skating_levels: { name: string } | null;
  } | null;
};

type ClassInstructorRow = {
  id: string;
  instructor_id: string;
  profiles: { full_name: string } | null;
};

function formatTime(time: string) {
  return time.slice(0, 5);
}

export default async function ClassDetailPage({
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
    { data: skatingClass },
    { data: profile },
    { data: enrollments },
    { data: allStudents },
    { data: classInstructors },
    { data: allInstructors },
  ] = await Promise.all([
    supabase
      .from("classes")
      .select("*, profiles(full_name), skating_levels(id, name)")
      .eq("id", params.id)
      .single<ClassWithJoins>(),
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
    supabase
      .from("enrollments")
      .select("id, student_id, students(first_name, last_name, skating_levels(name))")
      .eq("class_id", params.id)
      .returns<EnrollmentWithStudent[]>(),
    supabase
      .from("students")
      .select("id, first_name, last_name")
      .returns<Pick<Student, "id" | "first_name" | "last_name">[]>(),
    supabase
      .from("class_instructors")
      .select("id, instructor_id, profiles(full_name)")
      .eq("class_id", params.id)
      .returns<ClassInstructorRow[]>(),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "instructor")
      .returns<Pick<Profile, "id" | "full_name">[]>(),
  ]);

  if (!skatingClass) notFound();

  const admin = isAdmin(profile?.role);

  // Fetch skill counts + passed assessments for enrolled students
  const levelId = skatingClass.skating_levels?.id ?? null;
  const enrolledStudentIds = (enrollments ?? []).map((e) => e.student_id);

  const [{ data: levelSkills }, { data: studentAssessments }] = await Promise.all([
    levelId
      ? supabase.from("skills").select("id").eq("level_id", levelId)
      : Promise.resolve({ data: [] }),
    enrolledStudentIds.length > 0
      ? supabase
          .from("skill_assessments")
          .select("student_id, skill_id, status, assessed_at")
          .in("student_id", enrolledStudentIds)
          .order("assessed_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const totalLevelSkills = (levelSkills ?? []).length;
  const levelSkillIds = new Set((levelSkills ?? []).map((s: { id: string }) => s.id));

  // Build latest assessment per student+skill (only for this level's skills)
  const latestPerStudentSkill = new Map<string, string>(); // "sid:skillId" -> status
  for (const a of studentAssessments ?? []) {
    const key = `${a.student_id}:${a.skill_id}`;
    if (!latestPerStudentSkill.has(key) && levelSkillIds.has(a.skill_id)) {
      latestPerStudentSkill.set(key, a.status);
    }
  }

  // Count passed per student for this level
  const passedPerStudent = new Map<string, number>();
  latestPerStudentSkill.forEach((status, key) => {
    if (status === "passed") {
      const studentId = key.split(":")[0];
      passedPerStudent.set(studentId, (passedPerStudent.get(studentId) ?? 0) + 1);
    }
  });

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.student_id));
  const availableStudents = (allStudents ?? []).filter((s) => !enrolledIds.has(s.id));

  const assignedInstructors = (classInstructors ?? []).map((ci) => ({
    id: ci.id,
    instructor_id: ci.instructor_id,
    full_name: ci.profiles?.full_name ?? "",
  }));

  const assignedIds = new Set([
    skatingClass.instructor_id,
    ...assignedInstructors.map((a) => a.instructor_id),
  ]);
  const availableInstructors = (allInstructors ?? []).filter((i) => !assignedIds.has(i.id));

  const allAssignedNames = [
    skatingClass.profiles?.full_name,
    ...assignedInstructors.map((a) => a.full_name),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <Link href="/classes" className="back-link">← Back to classes</Link>

      {searchParams.success && (
        <p className="form-success mt-3">Changes saved successfully.</p>
      )}

      {/* Header */}
      <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-title">{skatingClass.name}</h1>
            {skatingClass.skating_levels?.name && (
              <LevelBadge levelName={skatingClass.skating_levels.name} />
            )}
          </div>
          <p className="page-subtitle mt-1">
            {skatingClass.day_of_week.charAt(0).toUpperCase() + skatingClass.day_of_week.slice(1)}
            {" · "}{formatTime(skatingClass.start_time)} – {formatTime(skatingClass.end_time)}
            {" · "}{skatingClass.location}
            {allAssignedNames && <> · {allAssignedNames}</>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Primary: Take Attendance (merges Start Session + Attendance) */}
          <Link href={`/classes/${params.id}/session`} className="btn-primary">
            Take Attendance
          </Link>
          <Link href={`/classes/${params.id}/assessments`} className="btn-secondary">
            View Assessments
          </Link>
          {admin && (
            <Link href={`/classes/${params.id}/edit`} className="btn-secondary">
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Admin instructor management */}
      {admin && (
        <div className="mt-6 max-w-lg card">
          <div className="px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-medium text-text-muted">Instructors</span>
          </div>
          <div className="px-4 py-3">
            <div className="mb-3 flex items-center justify-between rounded-md border border-slate-200 bg-surface px-3 py-2 text-sm">
              <span className="text-text-primary">{skatingClass.profiles?.full_name ?? "—"}</span>
              <span className="badge-gray">Primary</span>
            </div>
            <InstructorManager
              classId={params.id}
              assigned={assignedInstructors}
              available={availableInstructors}
            />
          </div>
        </div>
      )}

      {/* Enrolled Students */}
      <div className="mt-8">
        <h2 className="section-title mb-3">
          Enrolled Students
          {(enrollments ?? []).length > 0 && (
            <span className="ml-2 text-sm font-normal text-text-muted">
              {(enrollments ?? []).length}
            </span>
          )}
        </h2>

        {!enrollments || enrollments.length === 0 ? (
          <EmptyState
            title="No students enrolled yet"
            description="Add a student below to track attendance and skills."
          />
        ) : (
          <div className="card divide-y divide-slate-100">
            {enrollments.map((e) => {
              const studentName = `${e.students?.first_name ?? ""} ${e.students?.last_name ?? ""}`.trim();
              const levelName = e.students?.skating_levels?.name;
              const passed = passedPerStudent.get(e.student_id) ?? 0;

              return (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <AvatarInitials name={studentName || "?"} size="sm" />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/students/${e.student_id}/skills`}
                      className="text-sm font-medium text-text-primary hover:text-ice-600 hover:underline"
                    >
                      {studentName}
                    </Link>
                    {levelName && (
                      <div className="mt-0.5">
                        <LevelBadge levelName={levelName} />
                      </div>
                    )}
                  </div>
                  {totalLevelSkills > 0 && (
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-28">
                      <span className="text-xs text-text-muted">{passed}/{totalLevelSkills}</span>
                      <ProgressBar current={passed} total={totalLevelSkills} size="sm" />
                    </div>
                  )}
                  {admin && (
                    <form action={unenrollStudent} className="shrink-0">
                      <input type="hidden" name="enrollment_id" value={e.id} />
                      <input type="hidden" name="class_id" value={params.id} />
                      <button type="submit" className="btn-ghost text-xs text-danger hover:text-red-700">
                        Unenroll
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {admin && (
          <div className="mt-4">
            <EnrollStudentForm classId={params.id} availableStudents={availableStudents} />
          </div>
        )}
      </div>
    </div>
  );
}
