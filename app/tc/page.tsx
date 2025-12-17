"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface TransferCertificate {
  id: string;
  reason: string | null;
  status: string;
  issuedDate: string | null;
  tcDocumentUrl: string | null;
  createdAt: string;
  student: {
    id: string;
    user: { id: string; name: string | null; email: string | null };
    class: { id: string; name: string; section: string | null } | null;
  };
  requestedBy: { id: string; name: string | null; email: string | null } | null;
  approvedBy: { id: string; name: string | null; email: string | null } | null;
}

export default function TCPage() {
  const { data: session, status } = useSession();
  const [tcs, setTCs] = useState<TransferCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  useEffect(() => {
    if (session) {
      fetchTCs();
    }
  }, [session, filterStatus]);

  const fetchTCs = async () => {
    try {
      const url = filterStatus
        ? `/api/tc/list?status=${filterStatus}`
        : "/api/tc/list";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.tcs) {
        setTCs(data.tcs);
      }
    } catch (err) {
      console.error("Error fetching TCs:", err);
    }
  };

  const handleApprove = async (tcId: string, tcDocumentUrl?: string) => {
    if (
      !confirm(
        "Are you sure you want to approve this TC? This will deactivate the student account and save data to history."
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(`/api/tc/${tcId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tcDocumentUrl: tcDocumentUrl || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to approve TC");
        return;
      }

      alert("TC approved successfully! Student account has been deactivated.");
      fetchTCs();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (tcId: string) => {
    if (!confirm("Are you sure you want to reject this TC request?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/tc/${tcId}/reject`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to reject TC");
        return;
      }

      alert("TC request rejected successfully!");
      fetchTCs();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-300";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (status === "loading") return <p className="p-6">Loading session…</p>;
  if (!session) return <p className="p-6 text-red-600">Not authenticated</p>;

  return (
    <div className="min-h-screen bg-green-50">
      {/* Navbar */}
      <nav className="bg-green-600 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Transfer Certificate Management</h1>
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

        {/* Filter */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-auto border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* TC List */}
        {tcs.length === 0 ? (
          <p className="text-center p-6 text-gray-500">No TC requests found</p>
        ) : (
          <div className="space-y-4">
            {tcs.map((tc) => (
              <div
                key={tc.id}
                className="bg-white rounded-lg shadow-md p-6 border border-green-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-bold text-green-700">
                        {tc.student.user.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          tc.status
                        )}`}
                      >
                        {tc.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Email:</strong> {tc.student.user.email}
                      </p>
                      {tc.student.class && (
                        <p>
                          <strong>Class:</strong> {tc.student.class.name}
                          {tc.student.class.section
                            ? ` - ${tc.student.class.section}`
                            : ""}
                        </p>
                      )}
                      {tc.reason && (
                        <p>
                          <strong>Reason:</strong> {tc.reason}
                        </p>
                      )}
                      {tc.issuedDate && (
                        <p>
                          <strong>Issued Date:</strong>{" "}
                          {new Date(tc.issuedDate).toLocaleDateString()}
                        </p>
                      )}
                      <p>
                        <strong>Requested:</strong>{" "}
                        {new Date(tc.createdAt).toLocaleDateString()}
                      </p>
                      {tc.approvedBy && (
                        <p>
                          <strong>Approved by:</strong> {tc.approvedBy.name}
                        </p>
                      )}
                    </div>
                    {tc.tcDocumentUrl && (
                      <div className="mt-4">
                        <a
                          href={tc.tcDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline"
                        >
                          View TC Document
                        </a>
                      </div>
                    )}
                  </div>
                  {tc.status === "PENDING" && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(tc.id)}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(tc.id)}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
