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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome back, {profile?.full_name}.</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Students", value: studentCount ?? 0 },
            { label: "Total Classes", value: classCount ?? 0 },
            { label: "Total Enrollments", value: enrollmentCount ?? 0 },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg border border-gray-200 bg-white px-6 py-5"
            >
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Instructor view
  const { data: classes } = await supabase
    .from("classes")
    .select("*, profiles(full_name)")
    .eq("instructor_id", user!.id)
    .order("day_of_week")
    .order("start_time")
    .returns<ClassWithInstructor[]>();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600">Welcome back, {profile?.full_name}.</p>

      <h2 className="mt-8 text-lg font-semibold text-gray-900">Your Classes</h2>

      {!classes || classes.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No classes assigned yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/classes/${c.id}`}
              className="rounded-lg border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <p className="font-semibold text-gray-900">{c.name}</p>
              <p className="mt-1 text-sm text-gray-500">
                {formatSchedule(c.day_of_week, c.start_time, c.end_time)}
              </p>
              <p className="mt-1 text-sm text-gray-500">{c.location}</p>
              <span className="mt-2 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium capitalize text-blue-700">
                {c.level}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
