"use client";

import { useState } from "react";

export default function AddStudentPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    fatherName: "",
    email: "",
    phoneNo: "",
    aadhaarNo: "",
    dob: "",
    address: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // Client-side validation
    if (!form.name || !form.dob || !form.fatherName || !form.aadhaarNo || !form.phoneNo) {
      alert("Please fill in all required fields: Name, Date of Birth, Father Name, Aadhaar Number, and Phone Number");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/student/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to create student");
        return;
      }

      alert("Student created successfully");

      setForm({
        name: "",
        fatherName: "",
        email: "",
        phoneNo: "",
        aadhaarNo: "",
        dob: "",
        address: "",
      });
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-green-200">
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-semibold text-green-700 text-center">
            Add Student
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/** Student Name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Student Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter student name"
                required
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/** Father Name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Father Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="fatherName"
                value={form.fatherName}
                onChange={handleChange}
                placeholder="Enter father name"
                required
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/** Email */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="student@email.com"
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/** Phone */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="phoneNo"
                value={form.phoneNo}
                onChange={handleChange}
                placeholder="9876543210"
                required
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/** Aadhaar */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Aadhaar Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="aadhaarNo"
                value={form.aadhaarNo}
                onChange={handleChange}
                placeholder="XXXX-XXXX-XXXX"
                required
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/** DOB */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                required
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/** Address */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Student address"
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-medium transition"
          >
            {loading ? "Saving..." : "Create Student"}
          </button>

          <p className="text-xs text-center text-gray-500">
            Default password will be student's Date of Birth (YYYYMMDD)
          </p>
        </div>
      </div>
    </div>
  );
}
