"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Student {
  id: string;
  user: { id: string; name: string | null; email: string | null };
  class: { id: string; name: string; section: string | null } | null;
}

interface Class {
  id: string;
  name: string;
  section: string | null;
}

export default function MarkAttendancePage() {
  const { data: session, status } = useSession();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [period, setPeriod] = useState<number>(1);
  const [attendances, setAttendances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session && session.user.role === "TEACHER") {
      fetchClasses();
    }
  }, [session]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/class/list");
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Failed to fetch classes");
        return;
      }
      if (data.classes) {
        setClasses(data.classes);
        if (data.classes.length === 0) {
          setMessage("No classes found. Please create a class first.");
        }
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
      setMessage("Error fetching classes. Please try again.");
    }
  };

  const fetchStudents = async () => {
    if (!selectedClass) return;
    try {
      const res = await fetch(`/api/class/students?classId=${selectedClass}`);
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Failed to fetch students");
        setStudents([]);
        return;
      }
      if (data.students) {
        setStudents(data.students);
        if (data.students.length === 0) {
          setMessage("No students found in this class.");
        } else {
          setMessage("");
        }
        // Initialize all as PRESENT
        const initial: Record<string, string> = {};
        data.students.forEach((s: Student) => {
          initial[s.id] = "PRESENT";
        });
        setAttendances(initial);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setMessage("Error fetching students. Please try again.");
      setStudents([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !date || !period) {
      setMessage("Please select class, date, and period");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const attendanceArray = Object.entries(attendances).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass,
          date,
          period,
          attendances: attendanceArray,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to mark attendance");
        return;
      }

      setMessage("Attendance marked successfully!");
      // Reset form
      setAttendances({});
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return <p className="p-6">Loading session…</p>;
  if (!session) return <p className="p-6 text-red-600">Not authenticated</p>;
  if (session.user.role !== "TEACHER")
    return <p className="p-6 text-red-600">Forbidden: Teachers only</p>;

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-green-700 mb-6">Mark Attendance</h1>

        {message && (
          <div
            className={`p-4 mb-4 rounded ${
              message.includes("success")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section ? `- ${c.section}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period (1-8) <span className="text-red-500">*</span>
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                required
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                  <option key={p} value={p}>
                    Period {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {students.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Students Attendance</h2>
              <div className="space-y-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-green-50"
                  >
                    <span className="font-medium">{student.user.name}</span>
                    <select
                      value={attendances[student.id] || "PRESENT"}
                      onChange={(e) =>
                        setAttendances({ ...attendances, [student.id]: e.target.value })
                      }
                      className="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      <option value="PRESENT">Present</option>
                      <option value="ABSENT">Absent</option>
                      <option value="LATE">Late</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || students.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Mark Attendance"}
          </button>
        </form>
      </div>
    </div>
  );
}
