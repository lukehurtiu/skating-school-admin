"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addInstructor(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Unauthorized" };

  const class_id = formData.get("class_id") as string;
  const instructor_id = formData.get("instructor_id") as string;

  if (!class_id || !instructor_id) return { error: "Missing required fields" };

  const { data: instructorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", instructor_id)
    .single();

  if (!instructorProfile || instructorProfile.role !== "instructor") {
    return { error: "Invalid instructor" };
  }

  const { error } = await supabase
    .from("class_instructors")
    .insert({ class_id, instructor_id });

  if (error) {
    if (error.code === "23505") return { error: "Instructor already assigned" };
    return { error: "Failed to add instructor" };
  }

  revalidatePath(`/classes/${class_id}`);
}

export async function removeInstructor(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Unauthorized" };

  const class_instructor_id = formData.get("class_instructor_id") as string;
  const class_id = formData.get("class_id") as string;

  if (!class_instructor_id || !class_id) return { error: "Missing required fields" };

  const { error } = await supabase
    .from("class_instructors")
    .delete()
    .eq("id", class_instructor_id);

  if (error) return { error: "Failed to remove instructor" };

  revalidatePath(`/classes/${class_id}`);
}
