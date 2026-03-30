export type Role = "admin" | "instructor";

export type Level = "beginner" | "intermediate" | "advanced";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface SkatingClass {
  id: string;
  name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location: string;
  level: Level;
  instructor_id: string;
  created_at: string;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  level: Level;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  enrolled_at: string;
}

export interface AttendanceRecord {
  id: string;
  enrollment_id: string;
  class_id: string;
  student_id: string;
  date: string;
  status: "present" | "absent";
  created_at: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  level: Level;
  created_at: string;
}

export interface SkillAssessment {
  id: string;
  student_id: string;
  skill_id: string;
  instructor_id: string;
  passed: boolean;
  assessed_at: string;
}
