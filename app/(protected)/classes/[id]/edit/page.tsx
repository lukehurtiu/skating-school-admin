import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { SkatingClass, Profile, SkatingLevel } from "@/lib/types";
import EditClassForm from "./EditClassForm";
import DeleteClassButton from "../DeleteClassButton";

type ClassWithJoins = SkatingClass & {
  skating_levels: { name: string } | null;
};

export default async function EditClassPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "admin") redirect(`/classes/${params.id}`);

  const [{ data: skatingClass }, { data: instructors }, { data: levels }] = await Promise.all([
    supabase
      .from("classes")
      .select("*, skating_levels(name)")
      .eq("id", params.id)
      .single<ClassWithJoins>(),
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

  if (!skatingClass) notFound();

  return (
    <div>
      <Link href={`/classes/${params.id}`} className="back-link">← Back to class</Link>
      <h1 className="mt-4 page-title">Edit Class</h1>
      <p className="page-subtitle">Update the details for {skatingClass.name}.</p>
      <EditClassForm
        skatingClass={skatingClass}
        instructors={instructors ?? []}
        levels={levels ?? []}
      />

      <div className="mt-10 border-t border-slate-200 pt-6">
        <h2 className="text-sm font-semibold text-slate-900">Danger zone</h2>
        <p className="mt-1 text-sm text-slate-500">Deleting a class cannot be undone.</p>
        <div className="mt-3">
          <DeleteClassButton classId={params.id} />
        </div>
      </div>
    </div>
  );
}
