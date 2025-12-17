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

export default function AssignStudentsPage() {
  const { data: session, status } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [bulkSelections, setBulkSelections] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [createClassForm, setCreateClassForm] = useState({
    name: "",
    section: "",
  });

  useEffect(() => {
    if (session) {
      fetchStudents();
      fetchClasses();
    }
  }, [session]);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/student/list");
      const data = await res.json();
      if (data.students) {
        setStudents(data.students);
        // Reset bulk selections to only unassigned students
        const nextSelection: Record<string, boolean> = {};
        data.students.forEach((s: Student) => {
          if (!s.class) nextSelection[s.id] = false;
        });
        setBulkSelections(nextSelection);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

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

  const handleAssign = async (studentId: string, classId: string | null) => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/student/assign-class", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          classId: classId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to assign student");
        return;
      }

      setMessage(data.message || "Student assigned successfully");
      setSelectedStudent(null);
      setSelectedClass("");
      fetchStudents();
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAssign = (studentId: string, newClassId: string) => {
    handleAssign(studentId, newClassId || null);
  };

  const toggleBulkSelection = (studentId: string) => {
    setBulkSelections((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleBulkAssign = async () => {
    if (!selectedClass) {
      setMessage("Please select a class for bulk assignment");
      return;
    }
    const studentIds = Object.keys(bulkSelections).filter((id) => bulkSelections[id]);
    if (studentIds.length === 0) {
      setMessage("Select at least one unassigned student");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      await Promise.all(
        studentIds.map((id) =>
          fetch("/api/student/assign-class", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId: id, classId: selectedClass }),
          })
        )
      );
      setMessage("Students assigned successfully");
      setSelectedStudent(null);
      setSelectedClass("");
      fetchStudents();
    } catch (err) {
      console.error(err);
      setMessage("Bulk assignment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createClassForm.name) {
      setMessage("Class name is required");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/class/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createClassForm.name,
          section: createClassForm.section || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Failed to create class");
        return;
      }
      setMessage("Class created successfully");
      setCreateClassForm({ name: "", section: "" });
      setShowCreateClass(false);
      fetchClasses();
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong while creating class");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return <p className="p-6">Loading session…</p>;
  if (!session) return <p className="p-6 text-red-600">Not authenticated</p>;

  return (
    <div className="min-h-screen bg-green-50">
      {/* Navbar */}
      <nav className="bg-green-600 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Assign Students to Classes</h1>
        <a
          href="/classes"
          className="bg-white text-green-600 px-4 py-2 rounded hover:bg-green-100 transition"
        >
          Manage Classes
        </a>
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

        {/* Bulk Assignment Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4 text-green-700">
            Quick Assignment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Student
              </label>
              <select
                value={selectedStudent || ""}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="">Choose a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.user.name} ({student.user.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="">Choose a class</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name} {classItem.section ? `- ${classItem.section}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleBulkAssign}
                disabled={loading || !selectedClass}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Assigning..." : "Assign Selected Unassigned"}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Create Class */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-green-700">Create Class (inline)</h2>
            <button
              onClick={() => setShowCreateClass(!showCreateClass)}
              className="text-green-700 underline"
            >
              {showCreateClass ? "Hide" : "Add Class"}
            </button>
          </div>
          {showCreateClass && (
            <form onSubmit={handleCreateClass} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                className="border rounded px-3 py-2"
                placeholder="Class name *"
                value={createClassForm.name}
                onChange={(e) => setCreateClassForm({ ...createClassForm, name: e.target.value })}
                required
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Section (optional)"
                value={createClassForm.section}
                onChange={(e) =>
                  setCreateClassForm({ ...createClassForm, section: e.target.value })
                }
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "Create"}
              </button>
            </form>
          )}
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-green-600 text-white">
            <h2 className="text-xl font-bold">
              Students ({students.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Select
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Student Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Current Class
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Assign/Change Class
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No students found. Add students first!
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-green-50">
                      <td className="px-4 py-3 text-sm">
                        {!student.class && (
                          <input
                            type="checkbox"
                            checked={!!bulkSelections[student.id]}
                            onChange={() => toggleBulkSelection(student.id)}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {student.user.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.user.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.class
                          ? `${student.class.name} ${
                              student.class.section
                                ? `- ${student.class.section}`
                                : ""
                            }`
                          : "Not assigned"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          value={student.class?.id || ""}
                          onChange={(e) => handleQuickAssign(student.id, e.target.value)}
                          className="border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        >
                          <option value="">Remove from class</option>
                          {classes.map((classItem) => (
                            <option key={classItem.id} value={classItem.id}>
                              {classItem.name}{" "}
                              {classItem.section ? `- ${classItem.section}` : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {student.class && (
                          <button
                            onClick={() =>
                              handleAssign(student.id, null)
                            }
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Remove
                          </button>
                        )}
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
