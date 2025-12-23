// app/teachers/page.tsx
import Link from "next/link";

const actions = [
  { label: "Marks Entry", href: "/marks/entry" },
  { label: "Marks View", href: "/marks/view" },
  { label: "Attendance Mark", href: "/attendance/mark" },
  { label: "Attendance View", href: "/attendance/view" },
  { label: "Certificates", href: "/certificates" },
  { label: "Events", href: "/events" },
  { label: "Homeworks", href: "/homework" },
  { label: "News Feed", href: "/newsfeed" },
  { label: "communication", href: "/communication" },
  { label: "leaves", href: "/leaves" },
];

export default function TeachersPage() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg p-8 border border-green-200">
        <h1 className="text-3xl font-bold text-green-700 text-center mb-8">
          Teacher Dashboard
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {actions.map((action) => (
            <Link key={action.label} href={action.href}>
              <button className="w-full py-4 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition shadow">
                {action.label}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
