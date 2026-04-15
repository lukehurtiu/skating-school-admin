"use client";

import { useTransition } from "react";
import { markAttendance } from "./actions";

type StudentRow = {
  enrollmentId: string;
  studentId: string;
  name: string;
  status: "present" | "absent" | null;
};

type Props = {
  classId: string;
  date: string;
  students: StudentRow[];
};

export default function AttendanceSheet({ classId, date, students }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleMark(enrollmentId: string, studentId: string, status: "present" | "absent") {
    const formData = new FormData();
    formData.set("student_id", studentId);
    formData.set("class_id", classId);
    formData.set("enrollment_id", enrollmentId);
    formData.set("date", date);
    formData.set("status", status);
    startTransition(async () => {
      await markAttendance(formData);
    });
  }

  if (students.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-slate-200 bg-white px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-900">No students enrolled</p>
        <p className="mt-1 text-sm text-slate-500">Enroll students in this class to take attendance.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 table-container">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {["Student", "Status", "Actions"].map((h) => (
              <th key={h} className="th">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {students.map((s) => (
            <tr key={s.studentId} className="hover:bg-slate-50">
              <td className="td-primary">{s.name}</td>
              <td className="td">
                {s.status === "present" ? (
                  <span className="badge-green">Present</span>
                ) : s.status === "absent" ? (
                  <span className="badge-red">Absent</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="td">
                <div className="flex gap-2">
                  <button
                    disabled={isPending || s.status === "present"}
                    onClick={() => handleMark(s.enrollmentId, s.studentId, "present")}
                    className="btn-sm rounded-md bg-green-600 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-40"
                  >
                    Present
                  </button>
                  <button
                    disabled={isPending || s.status === "absent"}
                    onClick={() => handleMark(s.enrollmentId, s.studentId, "absent")}
                    className="btn-sm rounded-md bg-red-500 font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-40"
                  >
                    Absent
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
