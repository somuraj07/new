"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Event {
  id: string;
  title: string;
  description: string;
  amount: number | null;
  photo: string | null;
  eventDate: string | null;
  class: { id: string; name: string; section: string | null } | null;
  teacher: { id: string; name: string | null; email: string | null };
  _count: { registrations: number };
  isRegistered?: boolean;
  registrationStatus?: string | null;
}

interface Class {
  id: string;
  name: string;
  section: string | null;
}

export default function EventsPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    photo: "",
    eventDate: "",
    classId: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session) {
      fetchEvents();
      if (session.user.role === "TEACHER") {
        fetchClasses();
      }
    }
  }, [session]);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events/list");
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Failed to fetch events");
        return;
      }
      if (data.events) {
        setEvents(data.events);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setMessage("Error fetching events. Please try again.");
      setEvents([]);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/class/list");
      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to fetch classes:", data.message);
        return;
      }
      if (data.classes) {
        setClasses(data.classes);
      }
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      setMessage("Title and description are required");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          amount: form.amount ? parseFloat(form.amount) : null,
          photo: form.photo || null,
          eventDate: form.eventDate || null,
          classId: form.classId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to create event");
        return;
      }

      setMessage("Event created successfully!");
      setForm({
        title: "",
        description: "",
        amount: "",
        photo: "",
        eventDate: "",
        classId: "",
      });
      setShowForm(false);
      fetchEvents();
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId: string) => {
    if (!confirm("Are you sure you want to register for this event?")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to register");
        return;
      }

      alert("Successfully registered for the event!");
      fetchEvents();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return <p className="p-6">Loading session…</p>;
  if (!session) return <p className="p-6 text-red-600">Not authenticated</p>;

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-700">Events & Workshops</h1>
          {session.user.role === "TEACHER" && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              {showForm ? "Cancel" : "Create Event"}
            </button>
          )}
        </div>

        {message && (
          <div
            className={`p-4 mb-4 rounded ${
              message.includes("success")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Create Event Form (Teachers only) */}
        {showForm && session.user.role === "TEACHER" && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4 text-green-700">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={form.eventDate}
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class (Optional - leave empty for school-wide)
                  </label>
                  <select
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    <option value="">All Classes (School-wide)</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.section ? `- ${c.section}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.photo}
                    onChange={(e) => setForm({ ...form, photo: e.target.value })}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
            </form>
          </div>
        )}

        {/* Events List */}
        {events.length === 0 ? (
          <p className="text-center p-6 text-gray-500">No events found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {event.photo && (
                  <img
                    src={event.photo}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                  
                  <div className="space-y-2 mb-4 text-sm">
                    {event.class && (
                      <p>
                        <span className="font-medium">Class:</span> {event.class.name}{" "}
                        {event.class.section ? `- ${event.class.section}` : ""}
                      </p>
                    )}
                    {event.amount && (
                      <p>
                        <span className="font-medium">Amount:</span> ₹{event.amount}
                      </p>
                    )}
                    {event.eventDate && (
                      <p>
                        <span className="font-medium">Date:</span>{" "}
                        {new Date(event.eventDate).toLocaleString()}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Registrations:</span> {event._count.registrations}
                    </p>
                    <p>
                      <span className="font-medium">Created by:</span> {event.teacher.name}
                    </p>
                  </div>

                  {session.user.role === "STUDENT" && (
                    <button
                      onClick={() => handleRegister(event.id)}
                      disabled={loading || event.isRegistered}
                      className={`w-full py-2 rounded-lg font-medium transition ${
                        event.isRegistered
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {event.isRegistered
                        ? `Registered (${event.registrationStatus})`
                        : "Register"}
                    </button>
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
