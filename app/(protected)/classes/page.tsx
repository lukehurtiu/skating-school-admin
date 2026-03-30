import { createClient } from "@/lib/supabase/server";
import { SkatingClass } from "@/lib/types";
import Link from "next/link";

type ClassWithInstructor = SkatingClass & {
  profiles: { full_name: string } | null;
};

function formatDay(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

export default async function ClassesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const { data: classes } = await supabase
    .from("classes")
    .select("*, profiles(full_name)")
    .order("day_of_week")
    .order("start_time")
    .returns<ClassWithInstructor[]>();

  const isAdmin = profile?.role === "admin";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        {isAdmin && (
          <Link
            href="/classes/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New class
          </Link>
        )}
      </div>

      {!classes || classes.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">No classes yet.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Name", "Day", "Time", "Location", "Level", "Instructor", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {classes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDay(c.day_of_week)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatTime(c.start_time)} – {formatTime(c.end_time)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.location}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{c.level}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {c.profiles?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <Link href={`/classes/${c.id}`} className="text-blue-600 hover:underline">
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
