"use client"

import { useEffect, useState } from "react"

interface Leave {
  id: string
  leaveType: string
  fromDate: string
  toDate: string
  status: string
  remarks?: string | null
}

export default function TeacherLeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [form, setForm] = useState({
    leaveType: "CASUAL",
    reason: "",
    fromDate: "",
    toDate: ""
  })

  async function fetchLeaves() {
    const res = await fetch("/api/leaves/my")
    const data = await res.json()
    setLeaves(data)
  }

  async function applyLeave(e: any) {
    e.preventDefault()

    await fetch("/api/leaves/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })

    setForm({ leaveType: "CASUAL", reason: "", fromDate: "", toDate: "" })
    fetchLeaves()
  }

  useEffect(() => {
    fetchLeaves()
  }, [])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-green-700">Apply for Leave</h1>

      <form onSubmit={applyLeave} className="space-y-4 mb-8 bg-white shadow rounded-lg p-6">
        <select
          value={form.leaveType}
          onChange={e => setForm({ ...form, leaveType: e.target.value })}
          className="border p-2 w-full rounded"
        >
          <option value="CASUAL">Casual</option>
          <option value="SICK">Sick</option>
          <option value="PAID">Paid</option>
          <option value="UNPAID">Unpaid</option>
        </select>

        <div className="flex gap-4">
          <input
            type="date"
            value={form.fromDate}
            onChange={e => setForm({ ...form, fromDate: e.target.value })}
            className="border p-2 w-1/2 rounded"
          />
          <input
            type="date"
            value={form.toDate}
            onChange={e => setForm({ ...form, toDate: e.target.value })}
            className="border p-2 w-1/2 rounded"
          />
        </div>

        <textarea
          placeholder="Reason"
          value={form.reason}
          onChange={e => setForm({ ...form, reason: e.target.value })}
          className="border p-2 w-full rounded"
        />

        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
          Apply Leave
        </button>
      </form>

      <h2 className="text-2xl font-semibold mb-4 text-green-700">My Leaves</h2>

      {leaves.length === 0 ? (
        <p className="text-gray-500">No leaves applied yet</p>
      ) : (
        <div className="space-y-3">
          {leaves.map(l => (
            <div
              key={l.id}
              className="p-4 bg-white shadow rounded-lg border border-green-100 flex justify-between items-center hover:shadow-lg transition"
            >
              <div>
                <div className="font-semibold">{l.leaveType}</div>
                <div className="text-gray-500 text-sm">
                  {l.fromDate.slice(0, 10)} to {l.toDate.slice(0, 10)}
                </div>
              </div>
              <div>
                <span
                  className={`px-3 py-1 rounded-full font-semibold text-sm ${
                    l.status === "APPROVED"
                      ? "bg-green-200 text-green-800"
                      : l.status === "REJECTED"
                      ? "bg-red-200 text-red-800"
                      : "bg-yellow-200 text-yellow-800"
                  }`}
                >
                  {l.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
