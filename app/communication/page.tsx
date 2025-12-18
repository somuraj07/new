"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";

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

const socket = io("http://localhost:3001");

export default function CommunicationPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      const res = await fetch("/api/communication/appointments");
      if (!res.ok) return;
      const data = await res.json();
      setAppointments(data.appointments || []);
    };
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (!selected) return;

    const roomId = selected.id;
    socket.emit("join-room", roomId);

    const handler = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("receive-message", handler);

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
      socket.off("receive-message", handler);
    };
  }, [selected]);

  const sendMessage = async () => {
    if (!selected || !newMessage.trim()) return;

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
    socket.emit("send-message", { roomId: selected.id, message: msg });
  };

  return (
    <div className="p-6 mx-auto bg-green-50 min-h-screen flex gap-6">
      <div className="w-1/3 bg-white rounded-xl shadow p-4 space-y-3">
        <h2 className="text-xl font-bold text-green-800">Appointments</h2>
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
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col">
        {selected ? (
          <>
            <h2 className="text-xl font-bold text-green-800 mb-2">
              Chat for Appointment #{selected.id.slice(0, 6)}
            </h2>
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
                className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Type a message..."
              />
              <button
                onClick={sendMessage}
                className="bg-green-600 hover:bg-green-700 text-white px-4 rounded-lg text-sm font-semibold"
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
