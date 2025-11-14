"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

type Note = {
  id: string;
  title: string;
  content?: string;
  createdAt: string;
  isPinned?: boolean;
  category?: string;
};

const backend = "http://localhost:3001";

type Toast = {
  id: string;
  message: string;
  type?: "info" | "success" | "error";
};

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [sortType, setSortType] = useState("newest");
  const categories = ["Work", "Study", "Personal", "Other"];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("Other");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const [toasts, setToasts] = useState<Toast[]>([]);

  const categoryColors: Record<string, string> = {
    Work: "bg-yellow-200 text-yellow-800",
    Study: "bg-yellow-200 text-yellow-800",
    Personal: "bg-yellow-200 text-yellow-800",
    Other: "bg-yellow-200 text-yellow-800",
  };
  const router = useRouter();

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    router.push("/login");
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) router.push("/login");
  }, []);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const res = await fetch(`${backend}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotes(data);
    } catch {
      pushToast("Failed to load notes", "error");
    }
  }

  function pushToast(
    message: string,
    type: Toast["type"] = "info",
    ttl = 3000
  ) {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, ttl);
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return pushToast("Enter a title", "error");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${backend}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, category }),
      });
      const newNote = await res.json();
      setNotes((prev) => [newNote, ...prev]);
      setTitle("");
      setContent("");
      setCategory("");
      pushToast("Note added", "success");
    } catch {
      pushToast("Add failed", "error");
    }
  }

  async function deleteNote(id: string) {
    try {
      await fetch(`${backend}/notes/${id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      pushToast("Note deleted", "info");
    } catch {
      pushToast("Delete failed", "error");
    }
  }

  function startEdit(n: Note) {
    setEditingId(n.id);
    setEditTitle(n.title);
    setEditContent(n.content || "");
    setEditCategory(n.category || "Other");
  }

  function closeEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId) return;

    try {
      const res = await fetch(`${backend}/notes/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          category: editCategory,
        }),
      });

      const updated = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      pushToast("Note updated", "success");
      closeEdit();
    } catch {
      pushToast("Update failed", "error");
    }
  }

  async function togglePin(n: Note) {
    try {
      const res = await fetch(`${backend}/notes/${n.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !n.isPinned }),
      });

      const updated = await res.json();
      setNotes((prev) =>
        prev.map((note) => (note.id === updated.id ? updated : note))
      );
      pushToast(n.isPinned ? "Unpinned" : "Pinned", "info");
    } catch {
      pushToast("Pin failed", "error");
    }
  }

  const filtered = useMemo(() => {
    let result = [...notes];

    if (filterCategory !== "All")
      result = result.filter((n) => (n.category || "Other") === filterCategory);

    const q = search.trim().toLowerCase();
    if (q)
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.content || "").toLowerCase().includes(q)
      );

    if (sortType === "newest")
      result.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    else if (sortType === "oldest")
      result.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    else if (sortType === "asc")
      result.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortType === "desc")
      result.sort((a, b) => b.title.localeCompare(a.title));

    return result;
  }, [notes, search, sortType, filterCategory]);

  return (
    <main className="min-h-screen p-6 bg-white">
      <header className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
        </div>

        <button
          onClick={() => {
            setFilterCategory("All");
            setSearch("");
          }}
          className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 transition text-gray-900 font-medium rounded-lg shadow"
        >
          Clear Filters
        </button>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1">
          <form
            onSubmit={addNote}
            className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl shadow-md"
          >
            <label className="font-medium text-gray-700">Title</label>
            <input
              className="w-full p-2 mt-1 border rounded-lg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <label className="font-medium text-gray-700 mt-3 block">
              Content
            </label>
            <textarea
              className="w-full p-2 mt-1 border rounded-lg"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <label className="font-medium text-gray-700 mt-3 block">
              Category
            </label>
            <select
              className="w-full p-2 mt-1 border rounded-lg"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <button className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold p-2 rounded-lg shadow">
              Add Note
            </button>
          </form>

          <div className="mt-4 bg-white border p-3 shadow rounded-xl flex gap-2 flex-wrap">
            {["All", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setFilterCategory(c)}
                className={`px-4 py-1 rounded-full text-sm font-medium ${
                  filterCategory === c
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="flex gap-3 mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 p-2 border rounded-lg"
            />
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="p-2 border rounded-lg"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {filtered.map((n) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`p-4 rounded-xl border shadow-sm ${
                    n.isPinned ? "bg-yellow-100 border-yellow-300" : "bg-white"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-800">
                    {n.title}
                  </h3>

                  <p className="text-sm text-gray-600 mt-1">{n.content}</p>

                  <div className="flex items-center justify-between mt-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        categoryColors[n.category || "Other"]
                      }`}
                    >
                      {n.category || "Other"}
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => togglePin(n)}
                        className="text-gray-800"
                      >
                        {n.isPinned ? "⭐" : "☆"}
                      </button>

                      <button
                        onClick={() => startEdit(n)}
                        className="text-yellow-600 font-medium"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteNote(n.id)}
                        className="text-red-600 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {editingId && (
          <motion.div className="fixed inset-0 bg-black/30 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-lg p-6 rounded-xl shadow-xl"
            >
              <h2 className="text-xl font-semibold text-gray-800">Edit Note</h2>

              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full p-2 border rounded-lg mt-3"
              />

              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border rounded-lg mt-3"
                rows={4}
              />

              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full p-2 border rounded-lg mt-3"
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={closeEdit}
                  className="px-4 py-2 bg-gray-400 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 rounded-lg"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed top-6 right-6 flex flex-col gap-2">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`px-4 py-2 rounded-lg shadow ${
              t.type === "success"
                ? "bg-green-100 text-green-900"
                : t.type === "error"
                ? "bg-red-100 text-red-600"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {t.message}
          </motion.div>
        ))}

        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
