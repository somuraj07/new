"use client";
import { useEffect, useState } from "react";

interface Leave {
  id: string;
  teacher: { id: string; name: string; email: string };
  approver: { id: string; name: string } | null;
  leaveType: string;
  fromDate: string;
  toDate: string;
  status: string;
  remarks?: string | null;
}

export default function AdminLeavesPage() {
  const [allLeaves, setAllLeaves] = useState<Leave[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([]);
  const [remarksMap, setRemarksMap] = useState<{ [key: string]: string }>({});

  async function loadAll() {
    const res = await fetch("/api/leaves/all");
    const data = await res.json();
    setAllLeaves(data);
  }

  async function loadPending() {
    const res = await fetch("/api/leaves/pending");
    const data = await res.json();
    setPendingLeaves(data);
  }

  async function approve(id: string) {
    await fetch(`/api/leaves/${id}/approve`, { method: "PATCH" });
    loadAll();
    loadPending();
  }

  async function reject(id: string) {
    await fetch(`/api/leaves/${id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remarks: remarksMap[id] || "" }),
    });
    setRemarksMap(prev => ({ ...prev, [id]: "" }));
    loadAll();
    loadPending();
  }

  useEffect(() => {
    loadAll();
    loadPending();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-green-700">Admin Leave Management</h1>

      {/* All Leaves Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <table className="w-full border-collapse">
          <thead className="bg-green-100">
            <tr className="text-left">
              <th className="p-3 border-b">Teacher</th>
              <th className="p-3 border-b">Type</th>
              <th className="p-3 border-b">From</th>
              <th className="p-3 border-b">To</th>
              <th className="p-3 border-b">Status</th>
              <th className="p-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {allLeaves.map(l => (
              <tr key={l.id} className="hover:bg-green-50 transition">
                <td className="p-3 border-b">
                  <div className="font-medium">{l.teacher.name}</div>
                  <div className="text-xs text-gray-500">{l.teacher.email}</div>
                </td>
                <td className="p-3 border-b">{l.leaveType}</td>
                <td className="p-3 border-b">{l.fromDate.slice(0, 10)}</td>
                <td className="p-3 border-b">{l.toDate.slice(0, 10)}</td>
                <td className="p-3 border-b">
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-semibold ${
                      l.status === "APPROVED"
                        ? "bg-green-200 text-green-800"
                        : l.status === "REJECTED"
                        ? "bg-red-200 text-red-800"
                        : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {l.status}
                  </span>
                </td>
                <td className="p-3 border-b space-y-2">
                  {l.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => approve(l.id)}
                        className="w-full bg-green-600 text-white rounded px-3 py-1 hover:bg-green-700 transition"
                      >
                        Approve
                      </button>
                  
                      <button
                        onClick={() => reject(l.id)}
                        className="w-full bg-red-600 text-white rounded px-3 py-1 hover:bg-red-700 transition"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending Leaves */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-green-700">Pending Leaves</h2>
        {pendingLeaves.length === 0 ? (
          <p className="text-gray-500">No pending leaves</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingLeaves.map(l => (
              <div
                key={l.id}
                className="p-4 bg-white shadow rounded-lg border border-green-100 hover:shadow-lg transition"
              >
                <div className="font-semibold text-green-800">{l.teacher.name}</div>
                <div className="text-gray-500 text-sm">{l.teacher.email}</div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Type:</span> {l.leaveType}
                  <br />
                  <span className="font-medium">From:</span> {l.fromDate.slice(0, 10)}
                  <br />
                  <span className="font-medium">To:</span> {l.toDate.slice(0, 10)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
