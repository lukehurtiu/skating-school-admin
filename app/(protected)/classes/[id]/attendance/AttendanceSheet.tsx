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
    return <p className="mt-4 text-sm text-gray-500">No students enrolled in this class.</p>;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {["Student", "Status", "Actions"].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {students.map((s) => (
            <tr key={s.studentId} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.name}</td>
              <td className="px-4 py-3 text-sm">
                {s.status === "present" ? (
                  <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Present
                  </span>
                ) : s.status === "absent" ? (
                  <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    Absent
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex gap-2">
                  <button
                    disabled={isPending || s.status === "present"}
                    onClick={() => handleMark(s.enrollmentId, s.studentId, "present")}
                    className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-40"
                  >
                    Present
                  </button>
                  <button
                    disabled={isPending || s.status === "absent"}
                    onClick={() => handleMark(s.enrollmentId, s.studentId, "absent")}
                    className="rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-40"
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
