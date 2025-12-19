// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-10 border border-green-200">
        <h1 className="text-3xl font-extrabold text-green-700 text-center mb-8">
          School Dashboard
        </h1>

        <div className="space-y-5">
          <Link href="/classes" className="block">
            <div className="w-full py-4 rounded-2xl bg-green-600 text-white text-lg font-semibold text-center hover:bg-green-700 transition shadow-md">
              Classes
            </div>
          </Link>

          <Link href="/students" className="block">
            <div className="w-full py-4 rounded-2xl bg-green-500 text-white text-lg font-semibold text-center hover:bg-green-600 transition shadow-md">
              Students
            </div>
          </Link>

          <Link href="/teachers" className="block">
            <div className="w-full py-4 rounded-2xl bg-green-400 text-white text-lg font-semibold text-center hover:bg-green-500 transition shadow-md">
              Teachers
            </div>
          </Link>
          <Link href="/school" className="block">
            <div className="w-full py-4 rounded-2xl bg-green-400 text-white text-lg font-semibold text-center hover:bg-green-500 transition shadow-md">
              School Details
            </div>
          </Link>
          <Link href="/tc" className="block">
            <div className="w-full py-4 rounded-2xl bg-green-400 text-white text-lg font-semibold text-center hover:bg-green-500 transition shadow-md">
              TC Requests & Approvals
            </div>
          </Link>
          <Link href="/payments" className="block">
            <div className="w-full py-4 rounded-2xl bg-emerald-500 text-white text-lg font-semibold text-center hover:bg-emerald-600 transition shadow-md">
              Payments & Fees
            </div>
          </Link>
        </div>
        

        <p className="text-sm text-gray-500 text-center mt-8">
          Select a module to continue
        </p>
      </div>
    </div>
  );
}