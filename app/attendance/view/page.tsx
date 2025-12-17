"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Attendance {
  id: string;
  date: string;
  period: number;
  status: string;
  class: { id: string; name: string; section: string | null };
  teacher?: { id: string; name: string | null; email: string | null };
}

export default function ViewAttendancePage() {
  const { data: session, status } = useSession();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchAttendance();
    }
  }, [session, startDate, endDate]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/attendance/view?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to fetch attendance:", data.message);
        setAttendances([]);
        return;
      }
      if (data.attendances) {
        setAttendances(data.attendances);
      } else {
        setAttendances([]);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-800";
      case "ABSENT":
        return "bg-red-100 text-red-800";
      case "LATE":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading") return <p className="p-6">Loading session…</p>;
  if (!session) return <p className="p-6 text-red-600">Not authenticated</p>;

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-green-700 mb-6">My Attendance</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-center p-6">Loading...</p>
        ) : attendances.length === 0 ? (
          <p className="text-center p-6 text-gray-500">No attendance records found</p>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Period</th>
                    <th className="px-4 py-3 text-left">Class</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    {session.user.role !== "STUDENT" && (
                      <th className="px-4 py-3 text-left">Teacher</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendances.map((att) => (
                    <tr key={att.id} className="hover:bg-green-50">
                      <td className="px-4 py-3">
                        {new Date(att.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">Period {att.period}</td>
                      <td className="px-4 py-3">
                        {att.class.name} {att.class.section ? `- ${att.class.section}` : ""}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            att.status
                          )}`}
                        >
                          {att.status}
                        </span>
                      </td>
                      {session.user.role !== "STUDENT" && att.teacher && (
                        <td className="px-4 py-3">{att.teacher.name}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
