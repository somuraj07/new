"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ClipboardList,
  Eye,
  CalendarCheck,
  Calendar,
  FileText,
  Megaphone,
  BookOpen,
  Newspaper,
  MessageSquare,
} from "lucide-react"

import RequireRole from "./RequireRole"
import MarksEntryPage from "./MarksEntry"
import ViewMarksPage from "./MarksView"
import MarkAttendancePage from "./AtendMark"
import ViewAttendancePages from "@/app/attendance/view/page"
import CertificatesPage from "./Certificates"
import HomeworkPage from "./Homework"
import NewsFeedPage from "./NewsFeed"
import EventsPage from "./Events"
import CommunicationPage from "@/app/communication/page"
import TeacherLeavesPage from "./teacherleave"

/* ---------------- SIDEBAR ACTIONS ---------------- */

const actions = [
  { id: "marks-entry", label: "Marks Entry", icon: ClipboardList },
  { id: "marks-view", label: "Marks View", icon: Eye },
  { id: "attendance-mark", label: "Attendance Mark", icon: CalendarCheck },
  { id: "attendance-view", label: "Attendance View", icon: Calendar },
  { id: "certificates", label: "Certificates", icon: FileText },
  { id: "events", label: "Events", icon: Megaphone },
  { id: "homework", label: "Homeworks", icon: BookOpen },
  { id: "newsfeed", label: "News Feed", icon: Newspaper },
  { id: "communication", label: "Communication", icon: MessageSquare },
  { id: "leaves", label: "Leaves Management", icon: Calendar },
]

/* ---------------- MAIN PAGE ---------------- */

export default function TeachersPage() {
  const [active, setActive] = useState(actions[0])

  return (
    <div className="flex min-h-screen bg-green-50 m-0 p-0">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-green-200 shadow-lg">
        <div className="p-6 border-b border-green-200">
          <h1 className="text-2xl font-bold text-green-700">
            🎓 Teacher Panel
          </h1>
        </div>

        <nav className="p-4 space-y-2">
          {actions.map((item) => {
            const Icon = item.icon
            const isActive = active.id === item.id

            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActive(item)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition
                  ${
                    isActive
                      ? "bg-green-600 text-white shadow-md"
                      : "text-green-700 hover:bg-green-100"
                  }
                `}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            )
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-hidden m-0 p-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="bg-white h-full w-full overflow-hidden m-0 p-0 rounded-none shadow-none"
          >

            {/* CONTENT AREA */}
            <div className="h-full w-full m-0 p-0">
              {renderContent(active.id)}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

/* ---------------- CONTENT RENDERER ---------------- */

function renderContent(section: string) {
  switch (section) {
    case "marks-entry":
      return <MarksEntry />

    case "marks-view":
      return <MarksView />

    case "attendance-mark":
      return <AttendanceMark />

    case "attendance-view":
      return <AttendanceView />

    case "certificates":
      return <Certificate />

    case "homework":
      return <Homework />

    case "newsfeed":
      return <Newsfeed />

    case "events":
      return <Events />

    case "communication":
      return <Communication />

    case "leaves":
      return <Leaves />

    default:
      return <ComingSoon />
  }
}

/* ---------------- PAGE WRAPPERS ---------------- */

function MarksEntry() {
  return (
    <RequireRole allowedRoles={["TEACHER"]}>
      <MarksEntryPage />
    </RequireRole>
  )
}

function MarksView() {
  return (
    <RequireRole allowedRoles={["TEACHER"]}>
      <ViewMarksPage />
    </RequireRole>
  )
}

function AttendanceMark() {
  return (
    <RequireRole allowedRoles={["TEACHER"]}>
      <MarkAttendancePage />
    </RequireRole>
  )
}

function AttendanceView() {
  return (
    <RequireRole allowedRoles={["TEACHER"]}>
      <ViewAttendancePages />
    </RequireRole>
  )
}

function Certificate() {
  return (
    <RequireRole allowedRoles={["TEACHER"]}>
      <CertificatesPage />
    </RequireRole>
  )
}

function Homework() {
  return (
    <RequireRole allowedRoles={["TEACHER"]}>
      <HomeworkPage />
    </RequireRole>
  )
}

function Newsfeed() {
  return (
    <RequireRole allowedRoles={["TEACHER"]}>
      <NewsFeedPage />
    </RequireRole>
  )
}

function Events() {
  return (
    <RequireRole allowedRoles={["TEACHER"]}>
      <EventsPage />
    </RequireRole>
  )
}

function Communication() {
  return (
    <RequireRole allowedRoles={["TEACHER"]}>
      <CommunicationPage />
    </RequireRole>
  )
}

function Leaves() {
  return (
    <RequireRole allowedRoles={["TEACHER"]}>
      <TeacherLeavesPage />
    </RequireRole>
  )
}

/* ---------------- FALLBACK ---------------- */

function ComingSoon() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <p className="text-gray-500">
        🚧 Feature under development
      </p>
    </div>
  )
}
