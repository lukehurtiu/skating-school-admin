import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateClassForm from "./CreateClassForm";
import { Profile, SkatingLevel } from "@/lib/types";

export default async function NewClassPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "admin") redirect("/classes");

  const [{ data: instructors }, { data: levels }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "instructor")
      .order("full_name")
      .returns<Pick<Profile, "id" | "full_name">[]>(),
    supabase
      .from("skating_levels")
      .select("*")
      .order("sort_order")
      .returns<SkatingLevel[]>(),
  ]);

  return (
    <div>
      <Link href="/classes" className="back-link">← Back to classes</Link>
      <h1 className="mt-4 page-title">New Class</h1>
      <p className="page-subtitle">Add a new class to the schedule.</p>
      <CreateClassForm instructors={instructors ?? []} levels={levels ?? []} />
    </div>
  );
}
