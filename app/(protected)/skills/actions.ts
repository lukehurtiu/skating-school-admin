"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createSkill(formData: FormData) {
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

  const level_id = formData.get("level_id") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) ?? "";

  if (!level_id || !name) return { error: "Level and skill name are required" };

  // Determine next sort_order for this level
  const { data: existing } = await supabase
    .from("skills")
    .select("sort_order")
    .eq("level_id", level_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (existing?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from("skills")
    .insert({ level_id, name, description, sort_order });

  if (error) return { error: "Failed to create skill" };

  revalidatePath("/skills");
}

export async function updateSkill(formData: FormData) {
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

  const skill_id = formData.get("skill_id") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) ?? "";

  if (!skill_id || !name) return { error: "Skill name is required" };

  const { error } = await supabase
    .from("skills")
    .update({ name, description })
    .eq("id", skill_id);

  if (error) return { error: "Failed to update skill" };

  revalidatePath("/skills");
}

export async function createLevel(formData: FormData) {
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

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Level name is required" };

  const { data: existing } = await supabase
    .from("skating_levels")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (existing?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from("skating_levels")
    .insert({ name, sort_order });

  if (error) return { error: "Failed to create level" };

  revalidatePath("/skills");
}

export async function deleteSkill(formData: FormData) {
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

  const skill_id = formData.get("skill_id") as string;

  if (!skill_id) return { error: "Missing skill" };

  const { error } = await supabase.from("skills").delete().eq("id", skill_id);

  if (error) return { error: "Failed to delete skill" };

  revalidatePath("/skills");
}
