export type Role = "admin" | "instructor" | "guardian";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface SkatingLevel {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface SkatingClass {
  id: string;
  name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location: string;
  skating_level_id: string;
  instructor_id: string;
  created_at: string;
  skating_levels?: Pick<SkatingLevel, "id" | "name">;
}

export interface ClassInstructor {
  id: string;
  class_id: string;
  instructor_id: string;
  assigned_at: string;
  profiles?: Pick<Profile, "full_name">;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  skating_level_id: string;
  created_at: string;
  skating_levels?: Pick<SkatingLevel, "id" | "name">;
}

export interface GuardianStudent {
  id: string;
  guardian_id: string;
  student_id: string;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "email">;
  students?: Pick<Student, "first_name" | "last_name">;
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
  level_id: string;
  sort_order: number;
  created_at: string;
  skating_levels?: SkatingLevel;
}

export type AssessmentStatus = "not_assessed" | "in_progress" | "passed";

export interface SkillAssessment {
  id: string;
  student_id: string;
  skill_id: string;
  instructor_id: string;
  class_id: string;
  assessed_on: string;
  assessed_at: string;
  status: AssessmentStatus;
  comment: string;
  skills?: Pick<Skill, "name" | "sort_order">;
  profiles?: Pick<Profile, "full_name">;
}
