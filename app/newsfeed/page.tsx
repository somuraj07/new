"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface NewsFeed {
  id: string;
  title: string;
  description: string;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  createdBy: { id: string; name: string | null; email: string | null };
}

export default function NewsFeedPage() {
  const { data: session, status } = useSession();
  const [newsFeeds, setNewsFeeds] = useState<NewsFeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingFeed, setEditingFeed] = useState<NewsFeed | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    mediaUrl: "",
    mediaType: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session) {
      fetchNewsFeeds();
    }
  }, [session]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      setMessage("Title and description are required");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const url = editingFeed
        ? `/api/newsfeed/${editingFeed.id}`
        : "/api/newsfeed/create";
      const method = editingFeed ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          mediaUrl: form.mediaUrl || null,
          mediaType: form.mediaType || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to save news feed");
        return;
      }

      setMessage(editingFeed ? "News feed updated successfully!" : "News feed created successfully!");
      setForm({ title: "", description: "", mediaUrl: "", mediaType: "" });
      setShowForm(false);
      setEditingFeed(null);
      fetchNewsFeeds();
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (feed: NewsFeed) => {
    setEditingFeed(feed);
    setForm({
      title: feed.title,
      description: feed.description,
      mediaUrl: feed.mediaUrl || "",
      mediaType: feed.mediaType || "",
    });
    setShowForm(true);
    setMessage("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this news feed?")) return;

    try {
      const res = await fetch(`/api/newsfeed/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete news feed");
        return;
      }

      alert("News feed deleted successfully!");
      fetchNewsFeeds();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingFeed(null);
    setForm({ title: "", description: "", mediaUrl: "", mediaType: "" });
    setMessage("");
  };

  if (status === "loading") return <p className="p-6">Loading session…</p>;
  if (!session) return <p className="p-6 text-red-600">Not authenticated</p>;

  return (
    <div className="min-h-screen bg-green-50">
      {/* Navbar */}
      <nav className="bg-green-600 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">News Feed Management</h1>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => {
              handleCancel();
              setShowForm(!showForm);
            }}
            className="bg-white text-green-600 px-4 py-2 rounded hover:bg-green-100 transition"
          >
            {showForm ? "Cancel" : "Create News Feed"}
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

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4 text-green-700">
              {editingFeed ? "Edit News Feed" : "Create News Feed"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Media URL (Photo/Video)
                </label>
                <input
                  type="text"
                  value={form.mediaUrl}
                  onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Media Type
                </label>
                <select
                  value={form.mediaType}
                  onChange={(e) => setForm({ ...form, mediaType: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="">None</option>
                  <option value="PHOTO">Photo</option>
                  <option value="VIDEO">Video</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {loading
                  ? "Saving..."
                  : editingFeed
                  ? "Update News Feed"
                  : "Create News Feed"}
              </button>
            </form>
          </div>
        )}

        {/* News Feeds List */}
        {newsFeeds.length === 0 ? (
          <p className="text-center p-6 text-gray-500">No news feeds found</p>
        ) : (
          <div className="space-y-4">
            {newsFeeds.map((feed) => (
              <div
                key={feed.id}
                className="bg-white rounded-lg shadow-md p-6 border border-green-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-green-700 mb-2">
                      {feed.title}
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap mb-4">
                      {feed.description}
                    </p>
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
                      Created by: {feed.createdBy.name} •{" "}
                      {new Date(feed.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(feed)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(feed.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
