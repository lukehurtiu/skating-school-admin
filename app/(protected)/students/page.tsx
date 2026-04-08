import { createClient } from "@/lib/supabase/server";
import { Student } from "@/lib/types";
import { isAdmin } from "@/lib/utils";
import Link from "next/link";

export default async function StudentsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .order("last_name")
    .order("first_name")
    .returns<Student[]>();

  const admin = isAdmin(profile?.role);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        {admin && (
          <Link
            href="/students/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New student
          </Link>
        )}
      </div>

      {!students || students.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">No students yet.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Name", "Date of Birth", "Level", ""].map((h) => (
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
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {s.first_name} {s.last_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.date_of_birth}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{s.level}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    <Link href={`/students/${s.id}/skills`} className="text-blue-600 hover:underline">
                      Skills
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
