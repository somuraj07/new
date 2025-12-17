"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Mark {
  id: string;
  subject: string;
  marks: number;
  totalMarks: number;
  grade: string | null;
  suggestions: string | null;
  createdAt: string;
  class: { id: string; name: string; section: string | null };
  teacher?: { id: string; name: string | null; email: string | null };
  student?: {
    id: string;
    user: { id: string; name: string | null; email: string | null };
  };
}

export default function ViewMarksPage() {
  const { data: session, status } = useSession();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>("");

  useEffect(() => {
    if (session) {
      fetchMarks();
    }
  }, [session, subjectFilter]);

  const fetchMarks = async () => {
    setLoading(true);
    try {
      const url = subjectFilter
        ? `/api/marks/view?subject=${subjectFilter}`
        : "/api/marks/view";
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to fetch marks:", data.message);
        setMarks([]);
        return;
      }
      if (data.marks) {
        setMarks(data.marks);
      } else {
        setMarks([]);
      }
    } catch (err) {
      console.error("Error fetching marks:", err);
      setMarks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch("/api/marks/download?format=json");
      const data = await res.json();

      // Create a blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marks-report-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading marks:", err);
      alert("Failed to download marks report");
    }
  };

  const calculatePercentage = (marks: number, totalMarks: number) => {
    return ((marks / totalMarks) * 100).toFixed(2);
  };

  const getGradeColor = (grade: string | null) => {
    if (!grade) return "bg-gray-100 text-gray-800";
    if (grade === "A+") return "bg-green-100 text-green-800";
    if (grade === "A") return "bg-green-100 text-green-800";
    if (grade === "B+") return "bg-blue-100 text-blue-800";
    if (grade === "B") return "bg-blue-100 text-blue-800";
    if (grade === "C") return "bg-yellow-100 text-yellow-800";
    if (grade === "D") return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  if (status === "loading") return <p className="p-6">Loading session…</p>;
  if (!session) return <p className="p-6 text-red-600">Not authenticated</p>;

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-700">My Marks Report</h1>
          {session.user.role === "STUDENT" && (
            <button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              Download Report
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Subject
              </label>
              <input
                type="text"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                placeholder="Enter subject name..."
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-center p-6">Loading...</p>
        ) : marks.length === 0 ? (
          <p className="text-center p-6 text-gray-500">No marks found</p>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-600 text-white">
                  <tr>
                    {session.user.role !== "STUDENT" && (
                      <th className="px-4 py-3 text-left">Student</th>
                    )}
                    <th className="px-4 py-3 text-left">Subject</th>
                    <th className="px-4 py-3 text-left">Marks</th>
                    <th className="px-4 py-3 text-left">Total</th>
                    <th className="px-4 py-3 text-left">Percentage</th>
                    <th className="px-4 py-3 text-left">Grade</th>
                    <th className="px-4 py-3 text-left">Class</th>
                    {session.user.role !== "STUDENT" && (
                      <th className="px-4 py-3 text-left">Teacher</th>
                    )}
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {marks.map((mark) => (
                    <tr key={mark.id} className="hover:bg-green-50">
                      {session.user.role !== "STUDENT" && (
                        <td className="px-4 py-3 font-medium">
                          {mark.student?.user?.name || "N/A"}
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium">{mark.subject}</td>
                      <td className="px-4 py-3">{mark.marks}</td>
                      <td className="px-4 py-3">{mark.totalMarks}</td>
                      <td className="px-4 py-3">
                        {calculatePercentage(mark.marks, mark.totalMarks)}%
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(
                            mark.grade
                          )}`}
                        >
                          {mark.grade || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {mark.class.name} {mark.class.section ? `- ${mark.class.section}` : ""}
                      </td>
                      {session.user.role !== "STUDENT" && mark.teacher && (
                        <td className="px-4 py-3">{mark.teacher.name}</td>
                      )}
                      <td className="px-4 py-3">
                        {new Date(mark.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Show suggestions if any */}
        {marks.some((m) => m.suggestions) && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Teacher Suggestions</h2>
            <div className="space-y-4">
              {marks
                .filter((m) => m.suggestions)
                .map((mark) => (
                  <div key={mark.id} className="border-l-4 border-green-500 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{mark.subject}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(mark.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{mark.suggestions}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
