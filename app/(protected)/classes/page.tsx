import { createClient } from "@/lib/supabase/server";
import { SkatingClass } from "@/lib/types";
import Link from "next/link";
import { isAdmin } from "@/lib/utils";

type ClassRow = SkatingClass & {
  profiles: { full_name: string } | null;
  skating_levels: { name: string } | null;
};

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function formatTime(t: string) {
  return t.slice(0, 5);
}

function formatDay(d: string) {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: { success?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: rawClasses }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
    supabase
      .from("classes")
      .select("*, profiles(full_name), skating_levels(name)")
      .returns<ClassRow[]>(),
  ]);

  const admin = isAdmin(profile?.role);

  const classes = (rawClasses ?? []).sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week);
    if (dayDiff !== 0) return dayDiff;
    return a.start_time.localeCompare(b.start_time);
  });

  return (
    <div>
      {searchParams.success && (
        <p className="form-success mb-4">Changes saved successfully.</p>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-subtitle">All classes sorted by day and time.</p>
        </div>
        {admin && (
          <Link href="/classes/new" className="btn-primary">New class</Link>
        )}
      </div>

      {classes.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm font-medium text-slate-900">No classes yet</p>
          <p className="mt-1 text-sm text-slate-500">Create your first class to get started.</p>
          {admin && (
            <Link href="/classes/new" className="btn-primary mt-4 inline-block">
              Create first class
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 table-container">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["Name", "Day", "Time", "Location", "Level", "Instructor", ""].map((h) => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {classes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="td-primary">{c.name}</td>
                  <td className="td">{formatDay(c.day_of_week)}</td>
                  <td className="td">{formatTime(c.start_time)} – {formatTime(c.end_time)}</td>
                  <td className="td">{c.location}</td>
                  <td className="td">{c.skating_levels?.name ?? "—"}</td>
                  <td className="td">{c.profiles?.full_name ?? "—"}</td>
                  <td className="td text-right">
                    <Link href={`/classes/${c.id}`} className="text-indigo-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
