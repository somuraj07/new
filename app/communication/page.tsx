"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import io, { type Socket } from "socket.io-client";

type AppointmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

interface Appointment {
  id: string;
  studentId: string;
  teacherId: string;
  status: AppointmentStatus;
  note?: string | null;
}

interface ChatMessage {
  id: string;
  appointmentId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface TeacherLite {
  id: string;
  name: string | null;
  email: string | null;
}

export default function CommunicationPage() {
  const { data: session, status } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [teachers, setTeachers] = useState<TeacherLite[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

  useEffect(() => {
    const socketInstance = io(socketUrl);
    socketRef.current = socketInstance;
    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [socketUrl]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const fetchAppointments = async () => {
      const res = await fetch("/api/communication/appointments");
      if (!res.ok) return;
      const data = await res.json();
      setAppointments(data.appointments || []);
    };
    fetchAppointments();

    if (session?.user?.role === "STUDENT") {
      fetch("/api/teacher/list")
        .then((res) => res.json())
        .then((data) => setTeachers(data.teachers || []))
        .catch(() => setTeachers([]));
    }
  }, [status]);

  useEffect(() => {
    if (!selected) return;

    const roomId = selected.id;
    socketRef.current?.emit("join-room", roomId);

    const handler = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    };

    socketRef.current?.on("receive-message", handler);

    const fetchMessages = async () => {
      const res = await fetch(
        `/api/communication/messages?appointmentId=${roomId}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
    };

    fetchMessages();

    return () => {
      socketRef.current?.off("receive-message", handler);
    };
  }, [selected]);

  const sendMessage = async () => {
    if (!selected || !newMessage.trim() || selected.status !== "APPROVED") return;

    const res = await fetch("/api/communication/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: selected.id,
        content: newMessage.trim(),
      }),
    });

    if (!res.ok) return;

    const msg: ChatMessage = await res.json();
    setNewMessage("");
    setMessages((prev) => [...prev, msg]);
    socketRef.current?.emit("send-message", { roomId: selected.id, message: msg });
  };

  const createAppointment = async () => {
    if (!selectedTeacherId) {
      alert("Select a teacher to book an appointment");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/communication/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: selectedTeacherId, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to request appointment");
        return;
      }
      setAppointments((prev) => [data.appointment, ...prev]);
      setNote("");
    } finally {
      setSaving(false);
    }
  };

  const approveAppointment = async (appointmentId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/communication/appointments/${appointmentId}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to approve");
        return;
      }
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: "APPROVED" } : a))
      );
      if (selected?.id === appointmentId) {
        setSelected({ ...selected, status: "APPROVED" });
      }
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <p className="text-green-700">Loading communication...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <p className="text-red-600 font-semibold">You need to sign in to view communications.</p>
      </div>
    );
  }

  const role = session.user.role;
  if (role !== "STUDENT" && role !== "TEACHER") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <p className="text-red-600 font-semibold">
          Communication is available only between students and teachers.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto bg-green-50 min-h-screen flex gap-6">
      <div className="w-1/3 bg-white rounded-xl shadow p-4 space-y-3">
        <h2 className="text-xl font-bold text-green-800">Appointments</h2>
        {role === "STUDENT" && (
          <div className="space-y-2 border rounded-lg p-3">
            <p className="text-sm font-semibold text-green-700">Request Appointment</p>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full border rounded-lg px-2 py-2 text-sm"
            >
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || t.email || "Teacher"}
                </option>
              ))}
            </select>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              className="w-full border rounded-lg px-2 py-2 text-sm"
              rows={2}
            />
            <button
              onClick={createAppointment}
              disabled={saving}
              className="w-full bg-green-600 text-white text-sm rounded-lg py-2 hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? "Submitting..." : "Send Request"}
            </button>
          </div>
        )}
        {appointments.length === 0 && (
          <p className="text-gray-500 text-sm">No appointments yet.</p>
        )}
        {appointments.map((appt) => (
          <button
            key={appt.id}
            onClick={() => setSelected(appt)}
            className={`w-full text-left p-3 rounded-lg border text-sm mb-2 ${
              selected?.id === appt.id
                ? "border-green-600 bg-green-50"
                : "border-gray-200 hover:border-green-400"
            }`}
          >
            <div className="font-medium text-green-800">
              Appointment #{appt.id.slice(0, 6)}
            </div>
            <div className="text-xs text-gray-500">Status: {appt.status}</div>
            {role === "TEACHER" && appt.status !== "APPROVED" && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    approveAppointment(appt.id);
                  }}
                  disabled={saving}
                  className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-60"
                >
                  Approve
                </button>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col">
        {selected ? (
          <>
            <h2 className="text-xl font-bold text-green-800 mb-2">
              Chat for Appointment #{selected.id.slice(0, 6)}
            </h2>
            {selected.status !== "APPROVED" && (
              <div className="mb-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                Chat unlocks after the teacher approves this appointment.
              </div>
            )}
            <div className="flex-1 border rounded-lg p-3 mb-3 overflow-y-auto space-y-2 bg-green-50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-lg px-3 py-2 shadow-sm text-sm"
                >
                  <div className="text-[10px] text-gray-400 mb-1">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </div>
                  <div>{m.content}</div>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-xs text-gray-500">No messages yet.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={selected.status !== "APPROVED"}
                className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                placeholder="Type a message..."
              />
              <button
                onClick={sendMessage}
                disabled={selected.status !== "APPROVED"}
                className="bg-green-600 hover:bg-green-700 text-white px-4 rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Select an appointment to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}
