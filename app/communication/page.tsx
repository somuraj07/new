"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import io from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

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
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const socketRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

  /* ================= SOCKET CONNECT ================= */
  useEffect(() => {
    if (status !== "authenticated") return;

    const socket = io(socketUrl, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [socketUrl, status]);

  /* ================= FETCH APPOINTMENTS ================= */
  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/communication/appointments")
      .then((res) => res.json())
      .then((data) => setAppointments(data.appointments || []));

    if (session?.user?.role === "STUDENT") {
      fetch("/api/teacher/list")
        .then((res) => res.json())
        .then((data) => setTeachers(data.teachers || []));
    }
  }, [status, session?.user?.role]);

  /* ================= JOIN ROOM + REALTIME ================= */
  useEffect(() => {
    if (!selected || !socketRef.current) return;

    const roomId = selected.id;

    socketRef.current.emit("join-room", roomId);

    const handler = (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socketRef.current.on("receive-message", handler);

    // Fetch initial messages (merge, don't override)
    fetch(`/api/communication/messages?appointmentId=${roomId}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages((prev) => {
          const map = new Map(prev.map((m) => [m.id, m]));
          (data.messages || []).forEach((m: ChatMessage) =>
            map.set(m.id, m)
          );
          return Array.from(map.values());
        });
      });

    return () => {
      socketRef.current.emit("leave-room", roomId);
      socketRef.current.off("receive-message", handler);
    };
  }, [selected]);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= ACTIONS ================= */
  const sendMessage = async () => {
    if (!selected || !newMessage.trim() || selected.status !== "APPROVED")
      return;

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

    socketRef.current?.emit("send-message", {
      roomId: selected.id,
      message: msg,
    });
  };

  const createAppointment = async () => {
    if (!selectedTeacherId) return alert("Select a teacher");

    setSaving(true);
    try {
      const res = await fetch("/api/communication/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: selectedTeacherId, note }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message);
      setAppointments((p) => [data.appointment, ...p]);
      setNote("");
    } finally {
      setSaving(false);
    }
  };

  const approveAppointment = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/communication/appointments/${id}/approve`,
        { method: "POST" }
      );
      if (!res.ok) return;

      setAppointments((p) =>
        p.map((a) => (a.id === id ? { ...a, status: "APPROVED" } : a))
      );

      if (selected?.id === id)
        setSelected({ ...selected, status: "APPROVED" });
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading")
    return (
      <div className="h-screen grid place-items-center bg-gray-100 text-green-700">
        Loading chat…
      </div>
    );

  const role = session?.user?.role;

  /* ================= UI ================= */
  return (
    <div className="h-screen flex bg-[#f0f2f5]">
      {/* SIDEBAR */}
      <div className="w-[360px] bg-white border-r flex flex-col">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-green-700">
            Appointments
          </h2>
        </div>

        {role === "STUDENT" && (
          <div className="p-3 space-y-2 border-b">
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select Teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || t.email}
                </option>
              ))}
            </select>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
              rows={2}
              className="w-full border rounded-lg p-2 text-sm"
            />

            <button
              onClick={createAppointment}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm"
            >
              Request Appointment
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {appointments.map((a) => (
            <motion.button
              key={a.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelected(a)}
              className={`w-full text-left px-3 py-3 rounded-lg transition ${
                selected?.id === a.id
                  ? "bg-green-50 border border-green-500"
                  : "hover:bg-gray-100"
              }`}
            >
              <div className="font-medium text-sm">
                Appointment #{a.id.slice(0, 6)}
              </div>
              <div className="text-xs text-gray-500">{a.status}</div>

              {role === "TEACHER" && a.status !== "APPROVED" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    approveAppointment(a.id);
                  }}
                  className="mt-2 text-xs bg-green-600 text-white px-3 py-1 rounded"
                >
                  Approve
                </button>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* CHAT */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            <div className="h-14 bg-white border-b px-4 flex items-center font-medium text-green-700">
              Appointment #{selected.id.slice(0, 6)}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#efeae2]">
              <AnimatePresence>
                {messages.map((m) => {
                  const mine = m.senderId === session?.user?.id;

                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        mine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] border rounded-lg px-4 py-3 shadow-sm ${
                          mine
                            ? "bg-green-50 border-green-500"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <div className="text-sm text-gray-800 whitespace-pre-wrap">
                          {m.content}
                        </div>
                        <div className="text-[10px] text-right text-gray-500 mt-2">
                          {new Date(m.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>

            <div className="h-16 bg-white border-t px-4 flex items-center gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={selected.status !== "APPROVED"}
                placeholder="Type a message"
                className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={sendMessage}
                disabled={selected.status !== "APPROVED"}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full text-sm"
              >
                Send
              </motion.button>
            </div>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-gray-500">
            Select an appointment to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
