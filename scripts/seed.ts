/**
 * Seed script — populates the database with realistic demo data.
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL    — from .env.local
 *   SUPABASE_SERVICE_ROLE_KEY   — from Supabase dashboard → Settings → API → service_role key
 *
 * Usage:
 *   npm run seed
 *
 * Safe to re-run: existing seed users are deleted and recreated.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Seed data definitions ────────────────────────────────────────────────────

const SEED_USERS = [
  { email: "admin@skatingschool.com",       password: "Password123!", full_name: "Sarah Mitchell",   role: "admin"      as const },
  { email: "admin2@skatingschool.com",      password: "Password123!", full_name: "David Park",       role: "admin"      as const },
  { email: "instructor1@skatingschool.com", password: "Password123!", full_name: "Emily Chen",       role: "instructor" as const },
  { email: "instructor2@skatingschool.com", password: "Password123!", full_name: "James Kowalski",   role: "instructor" as const },
  { email: "instructor3@skatingschool.com", password: "Password123!", full_name: "Maria Santos",     role: "instructor" as const },
  { email: "student1@skatingschool.com",    password: "Password123!", full_name: "Lily Thompson",   role: "student"   as const },
  { email: "student2@skatingschool.com",    password: "Password123!", full_name: "Noah Garcia",      role: "student"   as const },
  { email: "student3@skatingschool.com",    password: "Password123!", full_name: "Aiden Brown",      role: "student"   as const },
];

const SEED_STUDENTS = [
  { first_name: "Lily",    last_name: "Thompson",  date_of_birth: "2018-03-12", level: "beginner" as const },
  { first_name: "Noah",    last_name: "Garcia",    date_of_birth: "2017-07-25", level: "beginner" as const },
  { first_name: "Emma",    last_name: "Wilson",    date_of_birth: "2016-11-03", level: "beginner" as const },
  { first_name: "Aiden",   last_name: "Brown",     date_of_birth: "2015-05-18", level: "intermediate" as const },
  { first_name: "Sophia",  last_name: "Martinez",  date_of_birth: "2015-09-30", level: "intermediate" as const },
  { first_name: "Lucas",   last_name: "Lee",       date_of_birth: "2014-02-14", level: "intermediate" as const },
  { first_name: "Olivia",  last_name: "Anderson",  date_of_birth: "2014-08-07", level: "advanced" as const },
  { first_name: "Ethan",   last_name: "Taylor",    date_of_birth: "2013-12-22", level: "advanced" as const },
  { first_name: "Ava",     last_name: "Hernandez", date_of_birth: "2019-04-01", level: "beginner" as const },
  { first_name: "Mason",   last_name: "Young",     date_of_birth: "2016-06-15", level: "beginner" as const },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`  ${msg}`);
}

function abort(msg: string, err: unknown): never {
  console.error(`\n✗ ${msg}`, err);
  process.exit(1);
}

// ─── Steps ────────────────────────────────────────────────────────────────────

async function createUsers(): Promise<Map<string, string>> {
  console.log("\n1. Creating auth users…");
  const emailToId = new Map<string, string>();

  for (const u of SEED_USERS) {
    // Delete existing user with this email to allow re-seeding
    const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const match = existing?.users.find((x) => x.email === u.email);
    if (match) {
      const { data: updated, error: updateErr } = await supabase.auth.admin.updateUserById(match.id, {
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name, role: u.role },
      });
      if (updateErr || !updated.user) abort(`Failed to update user ${u.email}`, updateErr);
      emailToId.set(u.email, updated.user.id);
      log(`updated existing ${u.email} (${updated.user.id})`);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    });
    if (error || !data.user) abort(`Failed to create user ${u.email}`, error);

    emailToId.set(u.email, data.user.id);
    log(`created ${u.email} (${data.user.id})`);
  }

  return emailToId;
}

async function setRoles(emailToId: Map<string, string>) {
  console.log("\n2. Setting roles…");
  const nonInstructors = SEED_USERS.filter((u) => u.role !== "instructor");

  for (const u of nonInstructors) {
    const id = emailToId.get(u.email)!;
    const { error } = await supabase
      .from("profiles")
      .update({ role: u.role })
      .eq("id", id);
    if (error) abort(`Failed to set role for ${u.email}`, error);
    log(`set ${u.email} → ${u.role}`);
  }
}

async function getLevelIdMap(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("skating_levels")
    .select("id, name");
  if (error || !data) abort("Failed to fetch skating levels", error);
  const nameToId: Record<string, string> = {};
  for (const l of data) nameToId[l.name] = l.id;
  // Map legacy level names to skating_levels names
  return {
    beginner:     nameToId["Level 1"],
    intermediate: nameToId["Level 3"],
    advanced:     nameToId["Level 5"],
    ...nameToId,
  };
}

async function seedStudents(): Promise<string[]> {
  console.log("\n3. Seeding students…");

  const levelIdMap = await getLevelIdMap();

  // Remove existing seed students by name to allow re-seeding
  await supabase
    .from("students")
    .delete()
    .in("last_name", SEED_STUDENTS.map((s) => s.last_name));

  const rows = SEED_STUDENTS.map(({ level, ...s }) => ({
    ...s,
    skating_level_id: levelIdMap[level],
  }));

  const { data, error } = await supabase
    .from("students")
    .insert(rows)
    .select("id");
  if (error || !data) abort("Failed to insert students", error);

  data.forEach((s, i) =>
    log(`created ${SEED_STUDENTS[i].first_name} ${SEED_STUDENTS[i].last_name} (${s.id})`)
  );
  return data.map((s) => s.id);
}

async function seedClasses(emailToId: Map<string, string>): Promise<string[]> {
  console.log("\n4. Seeding classes…");

  const levelIdMap = await getLevelIdMap();
  const i1 = emailToId.get("instructor1@skatingschool.com")!;
  const i2 = emailToId.get("instructor2@skatingschool.com")!;
  const i3 = emailToId.get("instructor3@skatingschool.com")!;

  const classDefs = [
    { name: "Parent Tot A",     day_of_week: "monday",    start_time: "09:00", end_time: "09:30", location: "Rink 1", level: "beginner" as const,     instructor_id: i1 },
    { name: "Tot 2 / Tot 3",    day_of_week: "wednesday", start_time: "10:00", end_time: "10:45", location: "Rink 1", level: "beginner" as const,     instructor_id: i1 },
    { name: "Level 1 / 2",      day_of_week: "tuesday",   start_time: "16:00", end_time: "17:00", location: "Rink 2", level: "intermediate" as const, instructor_id: i2 },
    { name: "Level 3 / 4",      day_of_week: "thursday",  start_time: "17:00", end_time: "18:00", location: "Rink 2", level: "intermediate" as const, instructor_id: i2 },
    { name: "Level 5 Advanced",  day_of_week: "saturday",  start_time: "08:00", end_time: "09:30", location: "Rink 1", level: "advanced" as const,     instructor_id: i3 },
  ];

  const classes = classDefs.map(({ level, ...c }) => ({
    ...c,
    skating_level_id: levelIdMap[level],
  }));

  // Remove existing seed classes by name
  await supabase
    .from("classes")
    .delete()
    .in("name", classes.map((c) => c.name));

  const { data, error } = await supabase
    .from("classes")
    .insert(classes)
    .select("id");
  if (error || !data) abort("Failed to insert classes", error);

  data.forEach((c, i) => log(`created "${classes[i].name}" (${c.id})`));
  return data.map((c) => c.id);
}

async function seedEnrollments(classIds: string[], studentIds: string[]) {
  console.log("\n5. Seeding enrollments…");

  const [parentTotId, tot23Id, level12Id, level34Id, level5Id] = classIds;
  // Students 0-2, 8-9 → beginner classes; 3-5 → intermediate; 6-7 → advanced
  const enrollments = [
    // Parent Tot A
    { class_id: parentTotId, student_id: studentIds[0] },
    { class_id: parentTotId, student_id: studentIds[1] },
    { class_id: parentTotId, student_id: studentIds[8] },
    // Tot 2 / Tot 3
    { class_id: tot23Id, student_id: studentIds[2] },
    { class_id: tot23Id, student_id: studentIds[9] },
    // Level 1 / 2
    { class_id: level12Id, student_id: studentIds[3] },
    { class_id: level12Id, student_id: studentIds[4] },
    { class_id: level12Id, student_id: studentIds[5] },
    // Level 3 / 4
    { class_id: level34Id, student_id: studentIds[4] },
    { class_id: level34Id, student_id: studentIds[5] },
    // Level 5
    { class_id: level5Id, student_id: studentIds[6] },
    { class_id: level5Id, student_id: studentIds[7] },
  ];

  const { data, error } = await supabase
    .from("enrollments")
    .insert(enrollments)
    .select("id");
  if (error || !data) abort("Failed to insert enrollments", error);
  log(`created ${data.length} enrollments`);

  return enrollments;
}

async function seedAttendance(
  classIds: string[],
  studentIds: string[],
  enrollments: { class_id: string; student_id: string }[]
) {
  console.log("\n6. Seeding attendance…");

  // Get enrollment IDs from DB
  const { data: enrollmentRows } = await supabase
    .from("enrollments")
    .select("id, class_id, student_id")
    .in("class_id", classIds);

  if (!enrollmentRows) abort("Could not fetch enrollments", null);

  const enrollmentMap = new Map(
    enrollmentRows.map((e) => [`${e.class_id}:${e.student_id}`, e.id])
  );

  // Past 3 session dates
  const today = new Date();
  const dates = [-14, -7, -1].map((offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().split("T")[0];
  });

  const records: {
    class_id: string;
    student_id: string;
    enrollment_id: string;
    date: string;
    status: "present" | "absent";
  }[] = [];

  for (const { class_id, student_id } of enrollments) {
    const enrollment_id = enrollmentMap.get(`${class_id}:${student_id}`);
    if (!enrollment_id) continue;
    for (const date of dates) {
      records.push({
        class_id,
        student_id,
        enrollment_id,
        date,
        status: Math.random() > 0.2 ? "present" : "absent",
      });
    }
  }

  const { error } = await supabase.from("attendance").upsert(records, {
    onConflict: "student_id,class_id,date",
  });
  if (error) abort("Failed to insert attendance", error);
  log(`created ${records.length} attendance records across 3 sessions`);
}

async function seedAssessments(
  classIds: string[],
  studentIds: string[],
  emailToId: Map<string, string>
) {
  console.log("\n7. Seeding skill assessments…");

  const i1 = emailToId.get("instructor1@skatingschool.com")!;
  const i2 = emailToId.get("instructor2@skatingschool.com")!;

  // Fetch skills for first 4 levels
  const { data: levels } = await supabase
    .from("skating_levels")
    .select("id, name, skills(id, sort_order)")
    .order("sort_order")
    .limit(4);

  if (!levels) abort("Could not fetch skating levels", null);

  const today = new Date().toISOString().split("T")[0];
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  const assessments: {
    student_id: string;
    skill_id: string;
    instructor_id: string;
    class_id: string;
    assessed_on: string;
    status: "not_assessed" | "in_progress" | "passed";
    comment: string;
  }[] = [];

  // Lily (studentIds[0]) — Parent Tot class, mostly passed first 3 skills
  const parentTotSkills = (levels[0]?.skills as { id: string; sort_order: number }[] ?? [])
    .sort((a, b) => a.sort_order - b.sort_order);

  for (let i = 0; i < parentTotSkills.length; i++) {
    assessments.push({
      student_id: studentIds[0],
      skill_id: parentTotSkills[i].id,
      instructor_id: i1,
      class_id: classIds[0],
      assessed_on: i < 3 ? lastWeek : today,
      status: i < 3 ? "passed" : i === 3 ? "in_progress" : "not_assessed",
      comment: i < 3 ? "Well done!" : i === 3 ? "Getting there" : "",
    });
  }

  // Aiden (studentIds[3]) — Level 1/2 class, about half the Level 1 skills passed
  const level1Skills = (levels[2]?.skills as { id: string; sort_order: number }[] ?? [])
    .sort((a, b) => a.sort_order - b.sort_order);

  for (let i = 0; i < level1Skills.length; i++) {
    const status =
      i < 5 ? "passed" : i < 8 ? "in_progress" : "not_assessed";
    if (status === "not_assessed") continue;
    assessments.push({
      student_id: studentIds[3],
      skill_id: level1Skills[i].id,
      instructor_id: i2,
      class_id: classIds[2],
      assessed_on: lastWeek,
      status,
      comment: status === "passed" ? "Solid technique" : "Needs more practice",
    });
  }

  const { error } = await supabase.from("skill_assessments").insert(assessments);
  if (error) abort("Failed to insert skill assessments", error);
  log(`created ${assessments.length} skill assessments`);
}

async function seedStudentLinks(emailToId: Map<string, string>, studentIds: string[]) {
  console.log("\n8. Linking student accounts to student records…");

  // student1 → Lily Thompson (index 0)
  // student2 → Noah Garcia   (index 1)
  // student3 → Aiden Brown   (index 3)
  const links = [
    { profile_id: emailToId.get("student1@skatingschool.com")!, student_id: studentIds[0] },
    { profile_id: emailToId.get("student2@skatingschool.com")!, student_id: studentIds[1] },
    { profile_id: emailToId.get("student3@skatingschool.com")!, student_id: studentIds[3] },
  ];

  // Clear existing links for these profiles
  await supabase
    .from("student_links")
    .delete()
    .in("profile_id", links.map((l) => l.profile_id));

  const { error } = await supabase.from("student_links").insert(links);
  if (error) abort("Failed to insert student links", error);

  log(`linked student1@skatingschool.com → Lily Thompson`);
  log(`linked student2@skatingschool.com → Noah Garcia`);
  log(`linked student3@skatingschool.com → Aiden Brown`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding skating school database…");

  const emailToId = await createUsers();
  await setRoles(emailToId);
  const studentIds = await seedStudents();
  const classIds = await seedClasses(emailToId);
  const enrollments = await seedEnrollments(classIds, studentIds);
  await seedAttendance(classIds, studentIds, enrollments);
  await seedAssessments(classIds, studentIds, emailToId);
  await seedStudentLinks(emailToId, studentIds);

  console.log("\n✓ Done! Seed accounts:");
  console.log("  admin@skatingschool.com       / Password123!  (admin)");
  console.log("  admin2@skatingschool.com      / Password123!  (admin)");
  console.log("  instructor1@skatingschool.com / Password123!  (instructor — Emily Chen)");
  console.log("  instructor2@skatingschool.com / Password123!  (instructor — James Kowalski)");
  console.log("  instructor3@skatingschool.com / Password123!  (instructor — Maria Santos)");
  console.log("  student1@skatingschool.com    / Password123!  (student — Lily Thompson)");
  console.log("  student2@skatingschool.com    / Password123!  (student — Noah Garcia)");
  console.log("  student3@skatingschool.com    / Password123!  (student — Aiden Brown)");
}

main();
