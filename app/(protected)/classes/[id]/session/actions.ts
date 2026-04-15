"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const VALID_STATUSES = ["present", "absent"] as const;
const VALID_SKILL_STATUSES = ["not_assessed", "in_progress", "passed"] as const;

export async function sessionMarkAttendance(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const student_id = formData.get("student_id") as string;
  const class_id = formData.get("class_id") as string;
  const enrollment_id = formData.get("enrollment_id") as string;
  const date = formData.get("date") as string;
  const status = formData.get("status") as string;

  if (!student_id || !class_id || !enrollment_id || !date || !status) {
    return { error: "Missing required fields" };
  }

  if (!(VALID_STATUSES as readonly string[]).includes(status)) {
    return { error: "Invalid status" };
  }

  const [{ data: classRow }, { data: profile }, { data: classInstructorRow }] =
    await Promise.all([
      supabase.from("classes").select("instructor_id").eq("id", class_id).single(),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase
        .from("class_instructors")
        .select("id")
        .eq("class_id", class_id)
        .eq("instructor_id", user.id)
        .maybeSingle(),
    ]);

  const isAdminUser = profile?.role === "admin";
  const isOwnClass = classRow?.instructor_id === user.id || !!classInstructorRow;
  if (!isAdminUser && !isOwnClass) return { error: "Unauthorized" };

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("id", enrollment_id)
    .eq("student_id", student_id)
    .eq("class_id", class_id)
    .single();

  if (!enrollment) return { error: "Invalid enrollment" };

  const { error } = await supabase.from("attendance").upsert(
    { student_id, class_id, enrollment_id, date, status },
    { onConflict: "student_id,class_id,date" }
  );

  if (error) return { error: "Failed to record attendance" };

  revalidatePath(`/classes/${class_id}/session`);
}

export async function sessionQuickAssess(formData: FormData) {
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

  if (!student_id || !skill_id || !class_id || !assessed_on || !status) {
    return { error: "Missing required fields" };
  }

  if (!(VALID_SKILL_STATUSES as readonly string[]).includes(status)) {
    return { error: "Invalid status" };
  }

  if (profile.role !== "admin") {
    const [{ data: classRow }, { data: ciRow }] = await Promise.all([
      supabase.from("classes").select("instructor_id").eq("id", class_id).single(),
      supabase
        .from("class_instructors")
        .select("id")
        .eq("class_id", class_id)
        .eq("instructor_id", user.id)
        .maybeSingle(),
    ]);
    if (classRow?.instructor_id !== user.id && !ciRow) return { error: "Unauthorized" };
  }

  const { error } = await supabase.from("skill_assessments").insert({
    student_id,
    skill_id,
    class_id,
    instructor_id: user.id,
    assessed_on,
    status,
    comment: "",
  });

  if (error) return { error: "Failed to save assessment" };

  revalidatePath(`/classes/${class_id}/session`);
  revalidatePath(`/students/${student_id}/skills`);
}
