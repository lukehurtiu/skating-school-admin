import { createClient } from "@/lib/supabase/server";
import { SkatingClass } from "@/lib/types";
import { isAdmin, formatSchedule, getTodayDayName, getDayOfWeekIndex } from "@/lib/utils";
import Link from "next/link";
import LevelBadge from "@/components/LevelBadge";
import AvatarInitials from "@/components/AvatarInitials";
import ProgressBar from "@/components/ProgressBar";

type ClassWithDetails = SkatingClass & {
  profiles: { full_name: string } | null;
  skating_levels: { name: string } | null;
};

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user!.id)
    .single();

  const admin = isAdmin(profile?.role);

  if (admin) {
    return <AdminDashboard profileName={profile?.full_name ?? ""} />;
  }

  // Instructor view
  return <InstructorDashboard userId={user!.id} profileName={profile?.full_name ?? ""} />;
}

async function AdminDashboard({ profileName }: { profileName: string }) {
  const supabase = createClient();
  const today = getTodayDayName();

  const [
    { count: studentCount },
    { count: classCount },
    { count: enrollmentCount },
    { data: allClasses },
    { data: enrollments },
    { data: students },
    { data: skillCounts },
    { data: allAssessments },
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("classes").select("*", { count: "exact", head: true }),
    supabase.from("enrollments").select("*", { count: "exact", head: true }),
    supabase
      .from("classes")
      .select("*, profiles(full_name), skating_levels(name)")
      .order("start_time")
      .returns<ClassWithDetails[]>(),
    supabase.from("enrollments").select("class_id, student_id"),
    supabase.from("students").select("id, first_name, last_name, skating_level_id, skating_levels(name)"),
    supabase.from("skills").select("id, level_id"),
    supabase
      .from("skill_assessments")
      .select("student_id, skill_id, status, assessed_at")
      .order("assessed_at", { ascending: false }),
  ]);

  // Enrollment count per class
  const enrollCountByClass = new Map<string, number>();
  for (const e of enrollments ?? []) {
    enrollCountByClass.set(e.class_id, (enrollCountByClass.get(e.class_id) ?? 0) + 1);
  }

  // Today's classes
  const todaysClasses = (allClasses ?? []).filter(
    (c) => c.day_of_week.toLowerCase() === today
  );

  // Upcoming this week (today + future days this week)
  const todayIdx = getDayOfWeekIndex(today);
  const upcomingDays = DAY_ORDER.slice(todayIdx + 1); // days after today
  const upcomingByDay: Record<string, ClassWithDetails[]> = {};
  for (const day of upcomingDays) {
    const dayClasses = (allClasses ?? []).filter(
      (c) => c.day_of_week.toLowerCase() === day
    );
    if (dayClasses.length > 0) {
      upcomingByDay[day] = dayClasses;
    }
  }

  // Skills near promotion
  const skillCountPerLevel = new Map<string, number>();
  for (const s of skillCounts ?? []) {
    skillCountPerLevel.set(s.level_id, (skillCountPerLevel.get(s.level_id) ?? 0) + 1);
  }

  // Latest assessment per student+skill
  const latestAssessment = new Map<string, string>(); // "sid:skillId" -> status
  for (const a of allAssessments ?? []) {
    const key = `${a.student_id}:${a.skill_id}`;
    if (!latestAssessment.has(key)) latestAssessment.set(key, a.status);
  }

  const passedCountPerStudent = new Map<string, number>();
  latestAssessment.forEach((status, key) => {
    if (status === "passed") {
      const sid = key.split(":")[0];
      passedCountPerStudent.set(sid, (passedCountPerStudent.get(sid) ?? 0) + 1);
    }
  });

  type StudentRow = { id: string; first_name: string; last_name: string; skating_level_id: string | null; skating_levels: { name: string } | null };
  const nearPromotion = ((students ?? []) as unknown as StudentRow[]).filter((s) => {
    if (!s.skating_level_id) return false;
    const total = skillCountPerLevel.get(s.skating_level_id) ?? 0;
    if (total === 0) return false;
    const passed = passedCountPerStudent.get(s.id) ?? 0;
    return passed / total >= 0.8;
  }).slice(0, 6);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {profileName}.</p>
        </div>
      </div>

      {/* Today's Sessions */}
      <section className="mt-8">
        <h2 className="section-title mb-4">
          Today&apos;s Sessions
          <span className="ml-2 text-sm font-normal text-text-muted capitalize">({today})</span>
        </h2>
        {todaysClasses.length === 0 ? (
          <div className="card px-6 py-8 text-center">
            <p className="text-sm text-text-muted">No sessions scheduled for today.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {todaysClasses.map((c) => (
              <Link
                key={c.id}
                href={`/classes/${c.id}`}
                className="card-hover p-5 block"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-text-primary">{c.name}</p>
                  {c.skating_levels?.name && (
                    <LevelBadge levelName={c.skating_levels.name} />
                  )}
                </div>
                <p className="mt-2 text-sm text-text-muted">
                  {c.start_time.slice(0, 5)} – {c.end_time.slice(0, 5)}
                </p>
                <p className="text-sm text-text-muted">{c.location}</p>
                {c.profiles?.full_name && (
                  <p className="mt-1 text-xs text-text-muted">{c.profiles.full_name}</p>
                )}
                <p className="mt-2 text-xs font-medium text-ice-600">
                  {enrollCountByClass.get(c.id) ?? 0} enrolled
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick Stats */}
      <section className="mt-10">
        <h2 className="section-title mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Students", value: studentCount ?? 0 },
            { label: "Total Classes", value: classCount ?? 0 },
            { label: "Total Enrollments", value: enrollmentCount ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="card px-5 py-4">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Students Near Promotion */}
      {nearPromotion.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Students Near Promotion</h2>
            <Link href="/students" className="text-sm text-ice-600 hover:underline">View all</Link>
          </div>
          <div className="card divide-y divide-slate-100">
            {nearPromotion.map((s) => {
              const levelId = s.skating_level_id;
              const total = levelId ? (skillCountPerLevel.get(levelId) ?? 0) : 0;
              const passed = passedCountPerStudent.get(s.id) ?? 0;
              return (
                <Link
                  key={s.id}
                  href={`/students/${s.id}/skills`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors"
                >
                  <AvatarInitials name={`${s.first_name} ${s.last_name}`} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {s.first_name} {s.last_name}
                    </p>
                    {s.skating_levels?.name && (
                      <LevelBadge levelName={s.skating_levels.name} />
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1 w-28 shrink-0">
                    <span className="text-xs text-text-muted">{passed}/{total} skills</span>
                    <ProgressBar current={passed} total={total} size="sm" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Upcoming This Week */}
      {Object.keys(upcomingByDay).length > 0 && (
        <section className="mt-10">
          <h2 className="section-title mb-4">Upcoming This Week</h2>
          <div className="space-y-4">
            {Object.entries(upcomingByDay).map(([day, classes]) => (
              <div key={day}>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2 capitalize">
                  {day}
                </p>
                <div className="card divide-y divide-slate-100">
                  {classes.map((c) => (
                    <Link
                      key={c.id}
                      href={`/classes/${c.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium text-text-primary">{c.name}</p>
                        {c.skating_levels?.name && (
                          <LevelBadge levelName={c.skating_levels.name} />
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-muted">
                          {c.start_time.slice(0, 5)} · {c.location}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

async function InstructorDashboard({
  userId,
  profileName,
}: {
  userId: string;
  profileName: string;
}) {
  const supabase = createClient();
  const today = getTodayDayName();

  const [{ data: primaryClasses }, { data: secondaryRows }, { data: enrollments }] = await Promise.all([
    supabase
      .from("classes")
      .select("*, profiles(full_name), skating_levels(name)")
      .eq("instructor_id", userId)
      .returns<ClassWithDetails[]>(),
    supabase
      .from("class_instructors")
      .select("classes(*, profiles(full_name), skating_levels(name))")
      .eq("instructor_id", userId)
      .returns<{ classes: ClassWithDetails }[]>(),
    supabase.from("enrollments").select("class_id"),
  ]);

  const enrollCountByClass = new Map<string, number>();
  for (const e of enrollments ?? []) {
    enrollCountByClass.set(e.class_id, (enrollCountByClass.get(e.class_id) ?? 0) + 1);
  }

  const seen = new Set<string>();
  const allMyClasses: ClassWithDetails[] = [];
  for (const c of [
    ...(primaryClasses ?? []),
    ...(secondaryRows ?? []).map((r) => r.classes).filter(Boolean),
  ] as ClassWithDetails[]) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      allMyClasses.push(c);
    }
  }

  allMyClasses.sort((a, b) => {
    const dayDiff = getDayOfWeekIndex(a.day_of_week) - getDayOfWeekIndex(b.day_of_week);
    if (dayDiff !== 0) return dayDiff;
    return a.start_time.localeCompare(b.start_time);
  });

  const todaysClasses = allMyClasses.filter((c) => c.day_of_week.toLowerCase() === today);
  const otherClasses = allMyClasses.filter((c) => c.day_of_week.toLowerCase() !== today);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {profileName}.</p>
        </div>
      </div>

      {/* Today */}
      {todaysClasses.length > 0 && (
        <section className="mt-8">
          <h2 className="section-title mb-4">
            Today&apos;s Sessions
            <span className="ml-2 text-sm font-normal text-text-muted capitalize">({today})</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {todaysClasses.map((c) => (
              <Link key={c.id} href={`/classes/${c.id}`} className="card-hover p-5 block">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-text-primary">{c.name}</p>
                  {c.skating_levels?.name && <LevelBadge levelName={c.skating_levels.name} />}
                </div>
                <p className="mt-2 text-sm text-text-muted">
                  {c.start_time.slice(0, 5)} – {c.end_time.slice(0, 5)} · {c.location}
                </p>
                <p className="mt-1 text-xs font-medium text-ice-600">
                  {enrollCountByClass.get(c.id) ?? 0} enrolled
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All my classes */}
      <section className="mt-8">
        <h2 className="section-title mb-4">Your Classes</h2>
        {otherClasses.length === 0 && todaysClasses.length === 0 ? (
          <div className="card px-6 py-10 text-center">
            <p className="text-sm font-medium text-text-primary">No classes assigned yet</p>
            <p className="mt-1 text-sm text-text-muted">Contact your administrator to be assigned to a class.</p>
          </div>
        ) : otherClasses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {otherClasses.map((c) => (
              <Link key={c.id} href={`/classes/${c.id}`} className="card-hover p-5 block">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-text-primary">{c.name}</p>
                  {c.skating_levels?.name && <LevelBadge levelName={c.skating_levels.name} />}
                </div>
                <p className="mt-2 text-sm text-text-muted">
                  {formatSchedule(c.day_of_week, c.start_time, c.end_time)}
                </p>
                <p className="text-sm text-text-muted">{c.location}</p>
                <p className="mt-1 text-xs font-medium text-ice-600">
                  {enrollCountByClass.get(c.id) ?? 0} enrolled
                </p>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
