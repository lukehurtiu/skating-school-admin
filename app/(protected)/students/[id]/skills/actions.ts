"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitAssessment(formData: FormData) {
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

  if (!profile) return { error: "Unauthorized" };

  const student_id = formData.get("student_id") as string;
  const skill_id = formData.get("skill_id") as string;
  const class_id = formData.get("class_id") as string;
  const assessed_on = formData.get("assessed_on") as string;
  const status = formData.get("status") as string;
  const comment = (formData.get("comment") as string) ?? "";

  if (!student_id || !skill_id || !class_id || !assessed_on || !status) {
    return { error: "Missing required fields" };
  }

  const VALID_STATUSES = ["not_assessed", "in_progress", "passed"];
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status" };

  // Instructors may only assess in their own classes
  if (profile.role !== "admin") {
    const { data: classRow } = await supabase
      .from("classes")
      .select("instructor_id")
      .eq("id", class_id)
      .single();

    const { data: classInstructorRow } = await supabase
      .from("class_instructors")
      .select("id")
      .eq("class_id", class_id)
      .eq("instructor_id", user.id)
      .maybeSingle();

    const isOwnClass =
      classRow?.instructor_id === user.id || !!classInstructorRow;

    if (!isOwnClass) return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("skill_assessments").insert({
    student_id,
    skill_id,
    class_id,
    instructor_id: user.id,
    assessed_on,
    status,
    comment,
  });

  if (error) return { error: "Failed to save assessment" };

  revalidatePath(`/students/${student_id}/skills`);
}
