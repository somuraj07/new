"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Homework {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string | null;
  createdAt: string;
  class: { id: string; name: string; section: string | null };
  teacher: { id: string; name: string | null; email: string | null };
  _count: { submissions: number };
}

interface Class {
  id: string;
  name: string;
  section: string | null;
}

export default function HomeworkPage() {
  const { data: session, status } = useSession();
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "",
    classId: "",
    dueDate: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session) {
      fetchHomeworks();
      fetchClasses();
    }
  }, [session]);

  const fetchHomeworks = async () => {
    try {
      const res = await fetch("/api/homework/list");
      const data = await res.json();
      if (res.ok && data.homeworks) {
        setHomeworks(data.homeworks);
      }
    } catch (err) {
      console.error("Error fetching homeworks:", err);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/class/list");
      const data = await res.json();
      if (res.ok && data.classes) {
        setClasses(data.classes);
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.subject || !form.classId) {
      setMessage("Title, description, subject, and class are required");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/homework/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          subject: form.subject,
          classId: form.classId,
          dueDate: form.dueDate || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to create homework");
        return;
      }

      setMessage("Homework created successfully!");
      setForm({ title: "", description: "", subject: "", classId: "", dueDate: "" });
      setShowForm(false);
      fetchHomeworks();
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingHomework(null);
    setForm({ title: "", description: "", subject: "", classId: "", dueDate: "" });
    setMessage("");
  };

  if (status === "loading") return <p className="p-6">Loading session…</p>;
  if (!session) return <p className="p-6 text-red-600">Not authenticated</p>;

  return (
    <div className="min-h-screen bg-green-50">
      {/* Navbar */}
      <nav className="bg-green-600 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Homework Management</h1>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => {
              handleCancel();
              setShowForm(!showForm);
            }}
            className="bg-white text-green-600 px-4 py-2 rounded hover:bg-green-100 transition"
          >
            {showForm ? "Cancel" : "Create Homework"}
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

        {/* Create Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4 text-green-700">Create Homework</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                    placeholder="e.g., Mathematics"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
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
                    Due Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Homework"}
              </button>
            </form>
          </div>
        )}

        {/* Homeworks List */}
        {homeworks.length === 0 ? (
          <p className="text-center p-6 text-gray-500">No homework assigned yet</p>
        ) : (
          <div className="space-y-4">
            {homeworks.map((homework) => (
              <div
                key={homework.id}
                className="bg-white rounded-lg shadow-md p-6 border border-green-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-green-700 mb-2">
                      {homework.title}
                    </h3>
                    <div className="flex gap-4 text-sm text-gray-600 mb-2">
                      <span>
                        <strong>Subject:</strong> {homework.subject}
                      </span>
                      <span>
                        <strong>Class:</strong> {homework.class.name}
                        {homework.class.section ? ` - ${homework.class.section}` : ""}
                      </span>
                      {homework.dueDate && (
                        <span>
                          <strong>Due:</strong>{" "}
                          {new Date(homework.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap mb-4">
                      {homework.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      Created by: {homework.teacher.name} •{" "}
                      {new Date(homework.createdAt).toLocaleDateString()} •{" "}
                      {homework._count.submissions} submission(s)
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
