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
}

interface Attendance {
  id: string;
  date: string;
  period: number;
  status: string;
  class: { id: string; name: string; section: string | null };
  teacher?: { id: string; name: string | null; email: string | null };
}

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

interface NewsFeed {
  id: string;
  title: string;
  description: string;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  createdBy: { id: string; name: string | null; email: string | null };
}

interface Homework {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string | null;
  createdAt: string;
  class: { id: string; name: string; section: string | null };
  teacher: { id: string; name: string | null; email: string | null };
  hasSubmitted?: boolean;
  submission?: { id: string; content: string | null; fileUrl: string | null; submittedAt: string } | null;
}

interface Certificate {
  id: string;
  title: string;
  description: string | null;
  issuedDate: string;
  certificateUrl: string | null;
  template: { id: string; name: string; description: string | null };
  issuedBy: { id: string; name: string | null; email: string | null };
}

interface TransferCertificate {
  id: string;
  reason: string | null;
  status: string;
  issuedDate: string | null;
  tcDocumentUrl: string | null;
  createdAt: string;
}

export default function StudentDashboardPage() {
  const { data: session, status } = useSession();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [newsFeeds, setNewsFeeds] = useState<NewsFeed[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [tc, setTc] = useState<TransferCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "marks" | "attendance" | "events" | "newsfeed" | "homework" | "certificates" | "tc">("overview");

  useEffect(() => {
    if (session && session.user.role === "STUDENT") {
      fetchAllData();
    }
  }, [session]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMarks(),
        fetchAttendance(),
        fetchEvents(),
        fetchNewsFeeds(),
        fetchHomeworks(),
        fetchCertificates(),
        fetchTC(),
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarks = async () => {
    try {
      const res = await fetch("/api/marks/view");
      const data = await res.json();
      if (res.ok && data.marks) {
        setMarks(data.marks);
      }
    } catch (err) {
      console.error("Error fetching marks:", err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const startDate = new Date(new Date().setDate(new Date().getDate() - 30))
        .toISOString()
        .split("T")[0];
      const endDate = new Date().toISOString().split("T")[0];
      const res = await fetch(
        `/api/attendance/view?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await res.json();
      if (res.ok && data.attendances) {
        setAttendances(data.attendances);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events/list");
      const data = await res.json();
      if (res.ok && data.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  const fetchNewsFeeds = async () => {
    try {
      const res = await fetch("/api/newsfeed/list");
      const data = await res.json();
      if (res.ok && data.newsFeeds) {
        setNewsFeeds(data.newsFeeds);
      }
    } catch (err) {
      console.error("Error fetching news feeds:", err);
    }
  };

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

  const fetchCertificates = async () => {
    try {
      const res = await fetch("/api/certificates/list");
      const data = await res.json();
      if (res.ok && data.certificates) {
        setCertificates(data.certificates);
      }
    } catch (err) {
      console.error("Error fetching certificates:", err);
    }
  };

  const fetchTC = async () => {
    try {
      const res = await fetch("/api/tc/list");
      const data = await res.json();
      if (res.ok && data.tcs && data.tcs.length > 0) {
        setTc(data.tcs[0]); // Get the most recent TC
      }
    } catch (err) {
      console.error("Error fetching TC:", err);
    }
  };

  const handleSubmitHomework = async (homeworkId: string, content: string, fileUrl?: string) => {
    try {
      const res = await fetch("/api/homework/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeworkId, content, fileUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to submit homework");
        return;
      }

      alert("Homework submitted successfully!");
      fetchHomeworks();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const handleApplyTC = async (reason: string) => {
    if (!confirm("Are you sure you want to apply for Transfer Certificate? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch("/api/tc/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to apply for TC");
        return;
      }

      alert("TC request submitted successfully! Waiting for admin approval.");
      fetchTC();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const calculateAttendanceStats = () => {
    const present = attendances.filter((a) => a.status === "PRESENT").length;
    const absent = attendances.filter((a) => a.status === "ABSENT").length;
    const late = attendances.filter((a) => a.status === "LATE").length;
    const total = attendances.length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : "0";

    return { present, absent, late, total, percentage };
  };

  const calculateMarksStats = () => {
    if (marks.length === 0) return { average: 0, totalSubjects: 0, highest: 0 };
    
    const totalPercentage = marks.reduce((sum, mark) => {
      return sum + (mark.marks / mark.totalMarks) * 100;
    }, 0);
    const average = (totalPercentage / marks.length).toFixed(1);
    const highest = Math.max(
      ...marks.map((mark) => (mark.marks / mark.totalMarks) * 100)
    ).toFixed(1);

    return {
      average: parseFloat(average),
      totalSubjects: marks.length,
      highest: parseFloat(highest),
    };
  };

  const handleRegisterEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to register for this event?")) return;

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
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-800 border-green-300";
      case "ABSENT":
        return "bg-red-100 text-red-800 border-red-300";
      case "LATE":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-green-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "STUDENT") {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <p className="text-red-600 text-lg font-medium">Access Denied</p>
          <p className="text-gray-600 mt-2">This page is only for students.</p>
        </div>
      </div>
    );
  }

  const attendanceStats = calculateAttendanceStats();
  const marksStats = calculateMarksStats();
  const recentMarks = marks.slice(0, 5);
  const recentAttendance = attendances.slice(0, 5);
  const upcomingEvents = events
    .filter((e) => !e.isRegistered)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-green-700">
                Welcome, {session.user?.name || "Student"}!
              </h1>
              <p className="text-gray-600 mt-1">Your academic dashboard</p>
            </div>
            <div className="bg-green-100 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-600">Student Portal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-2 bg-white rounded-lg p-1 shadow-md border border-green-200 overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: "📊" },
            { id: "newsfeed", label: "News Feed", icon: "📰" },
            { id: "homework", label: "Homework", icon: "📚" },
            { id: "marks", label: "Marks", icon: "📝" },
            { id: "attendance", label: "Attendance", icon: "✅" },
            { id: "events", label: "Events", icon: "🎉" },
            { id: "certificates", label: "Certificates", icon: "🏆" },
            { id: "tc", label: "TC", icon: "📄" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 rounded-md font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-green-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-green-50"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Attendance Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Attendance</p>
                    <p className="text-3xl font-bold text-green-700 mt-2">
                      {attendanceStats.percentage}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {attendanceStats.present} present out of {attendanceStats.total}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-4">
                    <span className="text-3xl">✅</span>
                  </div>
                </div>
              </div>

              {/* Marks Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Average Marks</p>
                    <p className="text-3xl font-bold text-blue-700 mt-2">
                      {marksStats.average}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {marksStats.totalSubjects} subjects
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-4">
                    <span className="text-3xl">📝</span>
                  </div>
                </div>
              </div>

              {/* Events Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Upcoming Events</p>
                    <p className="text-3xl font-bold text-purple-700 mt-2">
                      {upcomingEvents.length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Available for registration
                    </p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-4">
                    <span className="text-3xl">🎉</span>
                  </div>
                </div>
              </div>

              {/* Homework Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Pending Homework</p>
                    <p className="text-3xl font-bold text-orange-700 mt-2">
                      {homeworks.filter((h) => !h.hasSubmitted).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {homeworks.filter((h) => h.hasSubmitted).length} submitted
                    </p>
                  </div>
                  <div className="bg-orange-100 rounded-full p-4">
                    <span className="text-3xl">📚</span>
                  </div>
                </div>
              </div>

              {/* Certificates Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Certificates</p>
                    <p className="text-3xl font-bold text-yellow-700 mt-2">
                      {certificates.length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Total issued
                    </p>
                  </div>
                  <div className="bg-yellow-100 rounded-full p-4">
                    <span className="text-3xl">🏆</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Marks */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-green-700">Recent Marks</h2>
                <button
                  onClick={() => setActiveTab("marks")}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  View All →
                </button>
              </div>
              {recentMarks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No marks available yet</p>
              ) : (
                <div className="space-y-3">
                  {recentMarks.map((mark) => (
                    <div
                      key={mark.id}
                      className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{mark.subject}</p>
                        <p className="text-sm text-gray-600">
                          {mark.class.name} {mark.class.section ? `- ${mark.class.section}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-700">
                          {mark.marks}/{mark.totalMarks}
                        </p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(
                            mark.grade
                          )}`}
                        >
                          {mark.grade || "N/A"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Attendance */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-green-700">Recent Attendance</h2>
                <button
                  onClick={() => setActiveTab("attendance")}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  View All →
                </button>
              </div>
              {recentAttendance.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No attendance records yet</p>
              ) : (
                <div className="space-y-3">
                  {recentAttendance.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">
                          {new Date(att.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Period {att.period} • {att.class.name}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          att.status
                        )}`}
                      >
                        {att.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent News Feed */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-green-700">Latest News</h2>
                <button
                  onClick={() => setActiveTab("newsfeed")}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  View All →
                </button>
              </div>
              {newsFeeds.slice(0, 3).length === 0 ? (
                <p className="text-gray-500 text-center py-8">No news available</p>
              ) : (
                <div className="space-y-4">
                  {newsFeeds.slice(0, 3).map((feed) => (
                    <div
                      key={feed.id}
                      className="bg-green-50 rounded-lg p-4 border border-green-200 hover:bg-green-100 transition"
                    >
                      <h3 className="font-bold text-green-700 mb-2">{feed.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{feed.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(feed.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Homework */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-green-700">Pending Homework</h2>
                <button
                  onClick={() => setActiveTab("homework")}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  View All →
                </button>
              </div>
              {homeworks.filter((h) => !h.hasSubmitted).slice(0, 3).length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending homework</p>
              ) : (
                <div className="space-y-3">
                  {homeworks
                    .filter((h) => !h.hasSubmitted)
                    .slice(0, 3)
                    .map((homework) => (
                      <div
                        key={homework.id}
                        className="bg-orange-50 rounded-lg p-4 border border-orange-200 hover:bg-orange-100 transition"
                      >
                        <h3 className="font-bold text-orange-700 mb-1">{homework.title}</h3>
                        <p className="text-sm text-gray-600">
                          {homework.subject} • {homework.class.name}
                        </p>
                        {homework.dueDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Due: {new Date(homework.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-green-700">Upcoming Events</h2>
                <button
                  onClick={() => setActiveTab("events")}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  View All →
                </button>
              </div>
              {upcomingEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No upcoming events</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-gradient-to-br from-green-50 to-white rounded-lg p-4 border border-green-200 hover:shadow-md transition"
                    >
                      <h3 className="font-bold text-green-700 mb-2">{event.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {event.description}
                      </p>
                      {event.eventDate && (
                        <p className="text-xs text-gray-500 mb-3">
                          📅 {new Date(event.eventDate).toLocaleDateString()}
                        </p>
                      )}
                      <button
                        onClick={() => handleRegisterEvent(event.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition"
                      >
                        Register Now
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Marks Tab */}
        {activeTab === "marks" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-green-700 mb-6">My Marks Report</h2>
            {marks.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No marks available yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Subject</th>
                      <th className="px-4 py-3 text-left">Marks</th>
                      <th className="px-4 py-3 text-left">Total</th>
                      <th className="px-4 py-3 text-left">Percentage</th>
                      <th className="px-4 py-3 text-left">Grade</th>
                      <th className="px-4 py-3 text-left">Class</th>
                      <th className="px-4 py-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {marks.map((mark) => (
                      <tr key={mark.id} className="hover:bg-green-50">
                        <td className="px-4 py-3 font-medium">{mark.subject}</td>
                        <td className="px-4 py-3">{mark.marks}</td>
                        <td className="px-4 py-3">{mark.totalMarks}</td>
                        <td className="px-4 py-3">
                          {((mark.marks / mark.totalMarks) * 100).toFixed(1)}%
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
                        <td className="px-4 py-3">
                          {new Date(mark.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {marks.some((m) => m.suggestions) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-green-700">
                  Teacher Suggestions
                </h3>
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
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-700">My Attendance</h2>
              <div className="bg-green-100 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{attendanceStats.percentage}%</span> overall
                </p>
              </div>
            </div>

            {/* Attendance Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">{attendanceStats.present}</p>
                <p className="text-sm text-gray-600">Present</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-700">{attendanceStats.absent}</p>
                <p className="text-sm text-gray-600">Absent</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-700">{attendanceStats.late}</p>
                <p className="text-sm text-gray-600">Late</p>
              </div>
            </div>

            {attendances.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No attendance records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Period</th>
                      <th className="px-4 py-3 text-left">Class</th>
                      <th className="px-4 py-3 text-left">Status</th>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-green-700">Events & Workshops</h2>
            {events.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <p className="text-gray-500 text-lg">No events available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden border border-green-200 hover:shadow-xl transition"
                  >
                    {event.photo && (
                      <img
                        src={event.photo}
                        alt={event.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 text-green-700">{event.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>

                      <div className="space-y-2 mb-4 text-sm">
                        {event.class && (
                          <p className="text-gray-600">
                            <span className="font-medium">Class:</span> {event.class.name}
                            {event.class.section ? ` - ${event.class.section}` : ""}
                          </p>
                        )}
                        {event.amount && (
                          <p className="text-gray-600">
                            <span className="font-medium">Amount:</span> ₹{event.amount}
                          </p>
                        )}
                        {event.eventDate && (
                          <p className="text-gray-600">
                            <span className="font-medium">Date:</span>{" "}
                            {new Date(event.eventDate).toLocaleString()}
                          </p>
                        )}
                        <p className="text-gray-600">
                          <span className="font-medium">Registrations:</span>{" "}
                          {event._count.registrations}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRegisterEvent(event.id)}
                        disabled={event.isRegistered}
                        className={`w-full py-2 rounded-lg font-medium transition ${
                          event.isRegistered
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                      >
                        {event.isRegistered
                          ? `Registered (${event.registrationStatus || "PENDING"})`
                          : "Register Now"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* News Feed Tab */}
        {activeTab === "newsfeed" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-green-700">News Feed</h2>
            {newsFeeds.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <p className="text-gray-500 text-lg">No news feeds available</p>
              </div>
            ) : (
              <div className="space-y-6">
                {newsFeeds.map((feed) => (
                  <div
                    key={feed.id}
                    className="bg-white rounded-xl shadow-lg p-6 border border-green-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-green-700">{feed.title}</h3>
                      <span className="text-sm text-gray-500">
                        {new Date(feed.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">{feed.description}</p>
                    {feed.mediaUrl && (
                      <div className="mt-4">
                        {feed.mediaType === "VIDEO" ? (
                          <video
                            src={feed.mediaUrl}
                            controls
                            className="w-full rounded-lg max-h-96"
                          />
                        ) : (
                          <img
                            src={feed.mediaUrl}
                            alt={feed.title}
                            className="w-full rounded-lg max-h-96 object-cover"
                          />
                        )}
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-4">
                      Posted by: {feed.createdBy.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Homework Tab */}
        {activeTab === "homework" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-green-700">My Homework</h2>
            {homeworks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <p className="text-gray-500 text-lg">No homework assigned yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {homeworks.map((homework) => (
                  <div
                    key={homework.id}
                    className="bg-white rounded-xl shadow-lg p-6 border border-green-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-green-700">{homework.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Subject: {homework.subject} • Class: {homework.class.name}
                          {homework.class.section ? ` - ${homework.class.section}` : ""}
                        </p>
                      </div>
                      {homework.hasSubmitted && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          Submitted
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">{homework.description}</p>
                    {homework.dueDate && (
                      <p className="text-sm text-gray-600 mb-4">
                        Due Date: {new Date(homework.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {homework.hasSubmitted && homework.submission ? (
                      <div className="bg-green-50 p-4 rounded-lg mb-4">
                        <p className="font-medium text-green-700 mb-2">Your Submission:</p>
                        {homework.submission.content && (
                          <p className="text-gray-700 mb-2">{homework.submission.content}</p>
                        )}
                        {homework.submission.fileUrl && (
                          <a
                            href={homework.submission.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:underline"
                          >
                            View Submitted File
                          </a>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted on: {new Date(homework.submission.submittedAt).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <textarea
                          id={`homework-${homework.id}`}
                          placeholder="Enter your submission..."
                          className="w-full border rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                          rows={4}
                        />
                        <input
                          type="text"
                          id={`file-${homework.id}`}
                          placeholder="File URL (optional)"
                          className="w-full border rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                        <button
                          onClick={() => {
                            const content = (
                              document.getElementById(`homework-${homework.id}`) as HTMLTextAreaElement
                            )?.value;
                            const fileUrl = (
                              document.getElementById(`file-${homework.id}`) as HTMLInputElement
                            )?.value;
                            handleSubmitHomework(homework.id, content, fileUrl || undefined);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition"
                        >
                          Submit Homework
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Certificates Tab */}
        {activeTab === "certificates" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-green-700">My Certificates</h2>
            {certificates.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <p className="text-gray-500 text-lg">No certificates issued yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg p-6 border border-green-200 hover:shadow-xl transition"
                  >
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">🏆</div>
                      <h3 className="text-lg font-bold text-green-700">{cert.title}</h3>
                      {cert.description && (
                        <p className="text-sm text-gray-600 mt-2">{cert.description}</p>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Template:</span> {cert.template.name}
                      </p>
                      <p>
                        <span className="font-medium">Issued:</span>{" "}
                        {new Date(cert.issuedDate).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Issued by:</span> {cert.issuedBy.name}
                      </p>
                    </div>
                    {cert.certificateUrl && (
                      <a
                        href={cert.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 rounded-lg font-medium transition"
                      >
                        View Certificate
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TC Tab */}
        {activeTab === "tc" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-green-700">Transfer Certificate</h2>
            {tc ? (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200">
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-gray-700">Status:</p>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        tc.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : tc.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {tc.status}
                    </span>
                  </div>
                  {tc.reason && (
                    <div>
                      <p className="font-medium text-gray-700">Reason:</p>
                      <p className="text-gray-600">{tc.reason}</p>
                    </div>
                  )}
                  {tc.issuedDate && (
                    <div>
                      <p className="font-medium text-gray-700">Issued Date:</p>
                      <p className="text-gray-600">
                        {new Date(tc.issuedDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {tc.tcDocumentUrl && (
                    <div>
                      <a
                        href={tc.tcDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition inline-block"
                      >
                        Download TC Document
                      </a>
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    Requested on: {new Date(tc.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200">
                <p className="text-gray-600 mb-4">
                  You haven't applied for a Transfer Certificate yet.
                </p>
                <div>
                  <textarea
                    id="tc-reason"
                    placeholder="Enter reason for TC request..."
                    className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
                    rows={4}
                  />
                  <button
                    onClick={() => {
                      const reason = (
                        document.getElementById("tc-reason") as HTMLTextAreaElement
                      )?.value;
                      handleApplyTC(reason);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition"
                  >
                    Apply for TC
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
