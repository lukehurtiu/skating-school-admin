import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreateClassForm from "./CreateClassForm";

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

  const { data: instructors } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "instructor")
    .order("full_name");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">New class</h1>
      <CreateClassForm instructors={instructors ?? []} />
    </div>
  );
}
