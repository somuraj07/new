"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  School,
  Users,
  GraduationCap,
  Building2,
  FileCheck,
  CreditCard,
  Newspaper,
  Megaphone,
  Calendar,
} from "lucide-react"
import RequireRole from "./RequireRole"
import ClassesPage from "./Classes"
import AddStudentPage from "./addStudents"
import TeacherSignupPage from "./teachers"
import SchoolPage from "./school"
import TCPage from "./tc"
import Page from "@/app/payments/page"
import NewsFeedPage from "./NewsFeed"
import EventsPage from "./Events"
import AdminLeavesPage from "./adminleave"

/* ---------------- SIDEBAR ACTIONS ---------------- */

const actions = [
  { id: "classes", label: "Classes", icon: School },
  { id: "students", label: "Students", icon: Users },
  { id: "teachers", label: "Teachers", icon: GraduationCap },
  { id: "school", label: "School Details", icon: Building2 },
  { id: "tc", label: "TC Requests", icon: FileCheck },
  { id: "payments", label: "Payments & Fees", icon: CreditCard },
  { id: "newsfeed", label: "Newsfeed", icon: Newspaper },
  { id: "events", label: "Events", icon: Megaphone },
  { id: "leave", label: "Leave Applications", icon: Calendar },
]

/* ---------------- MAIN PAGE ---------------- */

export default function HomePage() {
  const [active, setActive] = useState(actions[0])

  return (
    <div className="flex min-h-screen bg-green-50">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-green-200 shadow-lg">
        <div className="p-6 border-b border-green-200">
          <h1 className="text-2xl font-bold text-green-700">
            🏫 School Dashboard
          </h1>
          <p className="text-sm text-green-600">
            Administration Panel
          </p>
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
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition text-left
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
      <main className="flex-1 overflow-hidden p-0 m-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="bg-white h-full w-full overflow-hidden p-0 m-0 rounded-none shadow-none"
          >
            {/* CONTENT AREA */}
            <div className="h-full w-full p-0 m-0">
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
    case "classes":
      return <Classes />
    case "students":
      return <Students />
    case "teachers":
      return <Teachers />
    case "school":
      return <SchoolDetails />
    case "tc":
      return <TCRequests />
    case "payments":
      return <Payments />
    case "newsfeed":
      return <NewsFeed />
    case "events":
      return <Events />
    case "leave":
      return <LeaveApplications />
    default:
      return <ComingSoon />
  }
}

/* ---------------- PAGE WRAPPERS ---------------- */

function Classes() {
  return (
    <RequireRole allowedRoles={["SCHOOLADMIN"]}>
      <ClassesPage />
    </RequireRole>
  )
}

function Students() {
  return (
    <RequireRole allowedRoles={["SCHOOLADMIN"]}>
      <AddStudentPage />
    </RequireRole>
  )
}

function Teachers() {
  return (
    <RequireRole allowedRoles={["SCHOOLADMIN"]}>
      <TeacherSignupPage />
    </RequireRole>
  )
}

function SchoolDetails() {
  return (
    <RequireRole allowedRoles={["SCHOOLADMIN"]}>
      <SchoolPage />
    </RequireRole>
  )
}

function TCRequests() {
  return (
    <RequireRole allowedRoles={["SCHOOLADMIN"]}>
      <TCPage />
    </RequireRole>
  )
}

function Payments() {
  return (
    <RequireRole allowedRoles={["SCHOOLADMIN"]}>
      <Page />
    </RequireRole>
  )
}

function NewsFeed() {
  return (
    <RequireRole allowedRoles={["SCHOOLADMIN"]}>
      <NewsFeedPage />
    </RequireRole>
  )
}

function Events() {
  return (
    <RequireRole allowedRoles={["SCHOOLADMIN"]}>
      <EventsPage />
    </RequireRole>
  )
}

function LeaveApplications() {
  return (
    <RequireRole allowedRoles={["SCHOOLADMIN"]}>
      <AdminLeavesPage />
    </RequireRole>
  )
}

/* ---------------- FALLBACK ---------------- */

function ComingSoon() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <p className="text-gray-500">🚧 Feature under development</p>
    </div>
  )
}
