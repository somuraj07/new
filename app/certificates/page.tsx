"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  template: string;
  imageUrl: string | null;
  createdAt: string;
  createdBy: { id: string; name: string | null; email: string | null };
  _count: { certificates: number };
}

interface Certificate {
  id: string;
  title: string;
  description: string | null;
  issuedDate: string;
  certificateUrl: string | null;
  student: {
    id: string;
    user: { id: string; name: string | null; email: string | null };
  };
  template: { id: string; name: string };
  issuedBy: { id: string; name: string | null; email: string | null };
}

interface Student {
  id: string;
  user: { id: string; name: string | null; email: string | null };
  class: { id: string; name: string; section: string | null } | null;
}

export default function CertificatesPage() {
  const { data: session, status } = useSession();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    template: "",
    imageUrl: "",
  });
  const [assignForm, setAssignForm] = useState({
    templateId: "",
    studentId: "",
    title: "",
    description: "",
    certificateUrl: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session) {
      fetchTemplates();
      fetchCertificates();
      fetchStudents();
    }
  }, [session]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/certificates/template/list");
      const data = await res.json();
      if (res.ok && data.templates) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
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

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/student/list");
      const data = await res.json();
      if (res.ok && data.students) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.name || !templateForm.template) {
      setMessage("Name and template are required");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/certificates/template/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateForm.name,
          description: templateForm.description || null,
          template: templateForm.template,
          imageUrl: templateForm.imageUrl || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to create template");
        return;
      }

      setMessage("Certificate template created successfully!");
      setTemplateForm({ name: "", description: "", template: "", imageUrl: "" });
      setShowTemplateForm(false);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.templateId || !assignForm.studentId || !assignForm.title) {
      setMessage("Template, student, and title are required");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/certificates/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: assignForm.templateId,
          studentId: assignForm.studentId,
          title: assignForm.title,
          description: assignForm.description || null,
          certificateUrl: assignForm.certificateUrl || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to assign certificate");
        return;
      }

      setMessage("Certificate assigned successfully!");
      setAssignForm({
        templateId: "",
        studentId: "",
        title: "",
        description: "",
        certificateUrl: "",
      });
      setShowAssignForm(false);
      fetchCertificates();
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return <p className="p-6">Loading session…</p>;
  if (!session) return <p className="p-6 text-red-600">Not authenticated</p>;

  return (
    <div className="min-h-screen bg-green-50">
      {/* Navbar */}
      <nav className="bg-green-600 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Certificates Management</h1>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => {
              setShowAssignForm(false);
              setShowTemplateForm(!showTemplateForm);
            }}
            className="bg-white text-green-600 px-4 py-2 rounded hover:bg-green-100 transition"
          >
            {showTemplateForm ? "Cancel" : "Create Template"}
          </button>
          <button
            onClick={() => {
              setShowTemplateForm(false);
              setShowAssignForm(!showAssignForm);
            }}
            className="bg-white text-green-600 px-4 py-2 rounded hover:bg-green-100 transition"
          >
            {showAssignForm ? "Cancel" : "Assign Certificate"}
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-6xl mx-auto">
        {message && (
          <div
            className={`p-4 mb-4 rounded ${
              message.includes("successfully")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Create Template Form */}
        {showTemplateForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4 text-green-700">
              Create Certificate Template
            </h2>
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, name: e.target.value })
                  }
                  required
                  placeholder="e.g., Academic Excellence"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, description: e.target.value })
                  }
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Content (HTML/JSON) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={templateForm.template}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, template: e.target.value })
                  }
                  required
                  rows={6}
                  placeholder="Enter template HTML or JSON content..."
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Background Image URL
                </label>
                <input
                  type="text"
                  value={templateForm.imageUrl}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, imageUrl: e.target.value })
                  }
                  placeholder="https://example.com/certificate-bg.jpg"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Template"}
              </button>
            </form>
          </div>
        )}

        {/* Assign Certificate Form */}
        {showAssignForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4 text-green-700">
              Assign Certificate to Student
            </h2>
            <form onSubmit={handleAssignCertificate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={assignForm.templateId}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, templateId: e.target.value })
                    }
                    required
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    <option value="">Select Template</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={assignForm.studentId}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, studentId: e.target.value })
                    }
                    required
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    <option value="">Select Student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.user.name} {s.class ? `(${s.class.name})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={assignForm.title}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, title: e.target.value })
                  }
                  required
                  placeholder="e.g., Academic Excellence Award"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={assignForm.description}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, description: e.target.value })
                  }
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate URL (Generated PDF/Image)
                </label>
                <input
                  type="text"
                  value={assignForm.certificateUrl}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, certificateUrl: e.target.value })
                  }
                  placeholder="https://example.com/certificate.pdf"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {loading ? "Assigning..." : "Assign Certificate"}
              </button>
            </form>
          </div>
        )}

        {/* Templates List */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-green-700 mb-4">
            Certificate Templates ({templates.length})
          </h2>
          {templates.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No templates created yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-green-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <h3 className="font-bold text-green-700 mb-2">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {template._count.certificates} certificate(s) issued
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certificates List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-green-700 mb-4">
            Issued Certificates ({certificates.length})
          </h2>
          {certificates.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No certificates issued yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Template</th>
                    <th className="px-4 py-3 text-left">Issued By</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-green-50">
                      <td className="px-4 py-3 font-medium">{cert.title}</td>
                      <td className="px-4 py-3">{cert.student.user.name}</td>
                      <td className="px-4 py-3">{cert.template.name}</td>
                      <td className="px-4 py-3">{cert.issuedBy.name}</td>
                      <td className="px-4 py-3">
                        {new Date(cert.issuedDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {cert.certificateUrl && (
                          <a
                            href={cert.certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:underline text-sm"
                          >
                            View
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
