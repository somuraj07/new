"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Class {
  id: string;
  name: string;
  section: string | null;
  teacher: { id: string; name: string | null; email: string | null } | null;
  _count: { students: number };
}

interface Teacher {
  id: string;
  name: string | null;
  email: string | null;
}

export default function ClassesPage() {
  const { data: session, status } = useSession();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [form, setForm] = useState({
    name: "",
    section: "",
    teacherId: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session) {
      fetchClasses();
      fetchTeachers();
    }
  }, [session]);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/class/list");
      const data = await res.json();
      if (data.classes) {
        setClasses(data.classes);
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teacher/list");
      const data = await res.json();
      if (data.teachers) {
        setTeachers(data.teachers);
      }
    } catch (err) {
      console.error("Error fetching teachers:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const url = editingClass
        ? `/api/class/${editingClass.id}`
        : "/api/class/create";
      const method = editingClass ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          section: form.section || null,
          teacherId: form.teacherId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to save class");
        return;
      }

      setMessage(data.message || "Class saved successfully");
      setShowForm(false);
      setEditingClass(null);
      setForm({ name: "", section: "", teacherId: "" });
      fetchClasses();
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setForm({
      name: classItem.name,
      section: classItem.section || "",
      teacherId: classItem.teacher?.id || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    try {
      const res = await fetch(`/api/class/${classId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete class");
        return;
      }

      alert("Class deleted successfully");
      fetchClasses();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClass(null);
    setForm({ name: "", section: "", teacherId: "" });
    setMessage("");
  };

  if (status === "loading") return <p className="p-6">Loading session…</p>;
  if (!session) return <p className="p-6 text-red-600">Not authenticated</p>;

  return (
    <div className="min-h-screen bg-green-50">
      {/* Navbar */}
      <nav className="bg-green-600 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Manage Classes</h1>
        <div className="flex gap-4 items-center">
          <a
            href="/students/assign"
            className="bg-white text-green-600 px-4 py-2 rounded hover:bg-green-100 transition"
          >
            Assign Students
          </a>
          <button
            onClick={() => {
              handleCancel();
              setShowForm(!showForm);
            }}
            className="bg-white text-green-600 px-4 py-2 rounded hover:bg-green-100 transition"
          >
            {showForm ? "Cancel" : "Add Class"}
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-6xl mx-auto">
        {message && (
          <div
            className={`p-4 mb-4 rounded ${
              message.includes("successfully")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold mb-4 text-green-700">
              {editingClass ? "Edit Class" : "Create New Class"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Class 1, Grade 5"
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section (Optional)
                </label>
                <input
                  type="text"
                  value={form.section}
                  onChange={(e) =>
                    setForm({ ...form, section: e.target.value })
                  }
                  placeholder="e.g., A, B, C"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Teacher (Optional)
                </label>
                <select
                  value={form.teacherId}
                  onChange={(e) =>
                    setForm({ ...form, teacherId: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="">Select a teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : editingClass
                    ? "Update Class"
                    : "Create Class"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Classes List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-green-600 text-white">
            <h2 className="text-xl font-bold">Classes ({classes.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Class Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Section
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Teacher
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Students
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {classes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No classes found. Create your first class!
                    </td>
                  </tr>
                ) : (
                  classes.map((classItem) => (
                    <tr key={classItem.id} className="hover:bg-green-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {classItem.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {classItem.section || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {classItem.teacher?.name || "Not assigned"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {classItem._count.students}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(classItem)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(classItem.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
