import { createClient } from "@/lib/supabase/server";
import { SkatingClass } from "@/lib/types";
import { isAdmin, formatSchedule } from "@/lib/utils";
import Link from "next/link";

type ClassWithInstructor = SkatingClass & {
  profiles: { full_name: string } | null;
};

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
    const [
      { count: studentCount },
      { count: classCount },
      { count: enrollmentCount },
    ] = await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("classes").select("*", { count: "exact", head: true }),
      supabase.from("enrollments").select("*", { count: "exact", head: true }),
    ]);

    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back, {profile?.full_name}.</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Students", value: studentCount ?? 0 },
            { label: "Total Classes", value: classCount ?? 0 },
            { label: "Total Enrollments", value: enrollmentCount ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="card px-6 py-5">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Instructor view — fetch classes where they are primary OR secondary instructor
  const [{ data: primaryClasses }, { data: secondaryRows }] = await Promise.all([
    supabase
      .from("classes")
      .select("*, profiles(full_name)")
      .eq("instructor_id", user!.id)
      .returns<ClassWithInstructor[]>(),
    supabase
      .from("class_instructors")
      .select("classes(*, profiles(full_name))")
      .eq("instructor_id", user!.id)
      .returns<{ classes: ClassWithInstructor }[]>(),
  ]);

  const secondaryClasses = (secondaryRows ?? [])
    .map((r) => r.classes)
    .filter(Boolean) as ClassWithInstructor[];

  const seen = new Set<string>();
  const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const classes = [...(primaryClasses ?? []), ...secondaryClasses]
    .filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    })
    .sort((a, b) => {
      const dayDiff = DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week);
      if (dayDiff !== 0) return dayDiff;
      return a.start_time.localeCompare(b.start_time);
    });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {profile?.full_name}.</p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Your Classes</h2>

      {!classes || classes.length === 0 ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-900">No classes assigned yet</p>
          <p className="mt-1 text-sm text-slate-500">Contact your administrator to be assigned to a class.</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/classes/${c.id}`}
              className="card p-5 transition-shadow hover:border-indigo-300 hover:shadow-sm"
            >
              <p className="font-semibold text-slate-900">{c.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {formatSchedule(c.day_of_week, c.start_time, c.end_time)}
              </p>
              <p className="mt-1 text-sm text-slate-500">{c.location}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
