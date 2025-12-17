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

export default function MarksEntryPage() {
  const { data: session, status } = useSession();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [form, setForm] = useState({
    subject: "",
    marks: "",
    totalMarks: "",
    suggestions: "",
  });
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
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setMessage("Error fetching students. Please try again.");
      setStudents([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedStudent || !form.subject || !form.marks || !form.totalMarks) {
      setMessage("Please fill all required fields");
      return;
    }

    if (parseFloat(form.marks) < 0 || parseFloat(form.totalMarks) <= 0 || parseFloat(form.marks) > parseFloat(form.totalMarks)) {
      setMessage("Invalid marks: marks must be between 0 and total marks");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/marks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent,
          classId: selectedClass,
          subject: form.subject,
          marks: parseFloat(form.marks),
          totalMarks: parseFloat(form.totalMarks),
          suggestions: form.suggestions || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to add marks");
        return;
      }

      setMessage("Marks added successfully!");
      setForm({ subject: "", marks: "", totalMarks: "", suggestions: "" });
      setSelectedStudent("");
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
        <h1 className="text-2xl font-bold text-green-700 mb-6">Add Marks</h1>

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

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedStudent("");
                }}
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
                Student <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                required
                disabled={!selectedClass}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-100"
              >
                <option value="">Select Student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g., Mathematics"
                required
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marks Obtained <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={form.marks}
                onChange={(e) => setForm({ ...form, marks: e.target.value })}
                placeholder="e.g., 85"
                required
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Marks <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={form.totalMarks}
                onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
                placeholder="e.g., 100"
                required
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Suggestions/Comments (Optional)
            </label>
            <textarea
              value={form.suggestions}
              onChange={(e) => setForm({ ...form, suggestions: e.target.value })}
              placeholder="Add suggestions or comments for the student..."
              rows={4}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Add Marks"}
          </button>
        </form>
      </div>
    </div>
  );
}
