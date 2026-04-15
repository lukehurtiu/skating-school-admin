"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const VALID_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export async function createClass(formData: FormData) {
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

  const name = formData.get("name") as string;
  const day_of_week = formData.get("day_of_week") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const location = formData.get("location") as string;
  const skating_level_id = formData.get("skating_level_id") as string;
  const instructor_id = formData.get("instructor_id") as string;

  if (!name || !day_of_week || !start_time || !end_time || !location || !skating_level_id || !instructor_id) {
    return { error: "All fields are required" };
  }

  if (!(VALID_DAYS as readonly string[]).includes(day_of_week)) {
    return { error: "Invalid day of week" };
  }

  if (start_time >= end_time) {
    return { error: "Start time must be before end time" };
  }

  const { data: levelRow } = await supabase
    .from("skating_levels")
    .select("id")
    .eq("id", skating_level_id)
    .single();

  if (!levelRow) return { error: "Invalid level" };

  const { data: instructorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", instructor_id)
    .single();

  if (!instructorProfile || instructorProfile.role !== "instructor") {
    return { error: "Invalid instructor" };
  }

  const { error } = await supabase
    .from("classes")
    .insert({ name, day_of_week, start_time, end_time, location, skating_level_id, instructor_id });

  if (error) return { error: "Failed to create class" };

  redirect("/classes?success=1");
}

export async function updateClass(formData: FormData) {
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
  const name = formData.get("name") as string;
  const day_of_week = formData.get("day_of_week") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const location = formData.get("location") as string;
  const skating_level_id = formData.get("skating_level_id") as string;
  const instructor_id = formData.get("instructor_id") as string;

  if (!class_id || !name || !day_of_week || !start_time || !end_time || !location || !skating_level_id || !instructor_id) {
    return { error: "All fields are required" };
  }

  if (!(VALID_DAYS as readonly string[]).includes(day_of_week)) {
    return { error: "Invalid day of week" };
  }

  if (start_time >= end_time) {
    return { error: "Start time must be before end time" };
  }

  const { data: levelRow } = await supabase
    .from("skating_levels")
    .select("id")
    .eq("id", skating_level_id)
    .single();

  if (!levelRow) return { error: "Invalid level" };

  const { data: instructorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", instructor_id)
    .single();

  if (!instructorProfile || instructorProfile.role !== "instructor") {
    return { error: "Invalid instructor" };
  }

  const { error } = await supabase
    .from("classes")
    .update({ name, day_of_week, start_time, end_time, location, skating_level_id, instructor_id })
    .eq("id", class_id);

  if (error) return { error: "Failed to update class" };

  revalidatePath("/classes");
  revalidatePath(`/classes/${class_id}`);
  redirect(`/classes/${class_id}?success=1`);
}

export async function deleteClass(formData: FormData) {
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
  if (!class_id) return { error: "Missing class" };

  const { error } = await supabase.from("classes").delete().eq("id", class_id);
  if (error) return { error: "Failed to delete class" };

  revalidatePath("/classes");
  redirect("/classes?success=1");
}

export async function enrollStudent(formData: FormData) {
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

  const student_id = formData.get("student_id") as string;
  const class_id = formData.get("class_id") as string;

  if (!student_id || !class_id) return { error: "Missing student or class" };

  const { error } = await supabase
    .from("enrollments")
    .insert({ student_id, class_id });

  if (error) {
    if (error.code === "23505") return { error: "Student already enrolled" };
    return { error: "Failed to enroll student" };
  }

  redirect(`/classes/${class_id}`);
}

export async function unenrollStudent(formData: FormData): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return;

  const enrollment_id = formData.get("enrollment_id") as string;
  const class_id = formData.get("class_id") as string;

  if (!enrollment_id || !class_id) return;

  await supabase.from("enrollments").delete().eq("id", enrollment_id);
  revalidatePath(`/classes/${class_id}`);
}
