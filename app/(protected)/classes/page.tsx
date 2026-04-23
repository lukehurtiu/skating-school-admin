import { createClient } from "@/lib/supabase/server";
import { SkatingClass } from "@/lib/types";
import Link from "next/link";
import { isAdmin, getDayOfWeekIndex } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
import ClassesViewToggle from "./ClassesViewToggle";

type ClassRow = SkatingClass & {
  profiles: { full_name: string } | null;
  skating_levels: { name: string } | null;
};

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: { success?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: rawClasses }, { data: enrollments }] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", user!.id).single(),
      supabase
        .from("classes")
        .select("*, profiles(full_name), skating_levels(name)")
        .returns<ClassRow[]>(),
      supabase.from("enrollments").select("class_id"),
    ]);

  const admin = isAdmin(profile?.role);

  // Enrollment count per class
  const enrollCountByClass = new Map<string, number>();
  for (const e of enrollments ?? []) {
    enrollCountByClass.set(e.class_id, (enrollCountByClass.get(e.class_id) ?? 0) + 1);
  }

  const classes = (rawClasses ?? [])
    .sort((a, b) => {
      const dayDiff = getDayOfWeekIndex(a.day_of_week) - getDayOfWeekIndex(b.day_of_week);
      if (dayDiff !== 0) return dayDiff;
      return a.start_time.localeCompare(b.start_time);
    })
    .map((c) => ({
      id: c.id,
      name: c.name,
      day_of_week: c.day_of_week,
      start_time: c.start_time,
      end_time: c.end_time,
      location: c.location,
      enrollmentCount: enrollCountByClass.get(c.id) ?? 0,
      instructorName: c.profiles?.full_name ?? null,
      levelName: c.skating_levels?.name ?? null,
    }));

  return (
    <div>
      {searchParams.success && (
        <p className="form-success mb-4">Changes saved successfully.</p>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-subtitle">{classes.length} classes scheduled</p>
        </div>
        {admin && (
          <Link href="/classes/new" className="btn-primary">New class</Link>
        )}
      </div>

      <div className="mt-6">
        {classes.length === 0 ? (
          <EmptyState
            title="No classes yet"
            description="Create your first class to get started."
            actionLabel={admin ? "Create first class" : undefined}
            actionHref={admin ? "/classes/new" : undefined}
          />
        ) : (
          <ClassesViewToggle classes={classes} />
        )}
      </div>
    </div>
  );
}
