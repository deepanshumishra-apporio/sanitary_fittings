"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import type { Category } from "@/lib/types";
import { cls } from "@/lib/theme";

interface FormState {
  name: string;
  description: string;
  parentId: string;
}

const EMPTY: FormState = { name: "", description: "", parentId: "" };

function extractError(err: unknown): string {
  if (err instanceof Error && "response" in err) {
    const r = (err as { response?: { data?: { error?: string } } }).response;
    if (r?.data?.error) return r.data.error;
  }
  return "";
}

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<{ data: Category[] }>("/category");
      setCategories(data.data);
    } catch {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  function openCreate() {
    setForm(EMPTY);
    setEditTarget(null);
    setError("");
    setDrawerOpen(true);
  }

  function openEdit(c: { id: string; name: string; description: string | null; parentId?: string | null }) {
    setForm({ name: c.name, description: c.description ?? "", parentId: c.parentId ?? "" });
    setEditTarget({ ...c, parentId: c.parentId ?? null, children: undefined });
    setError("");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditTarget(null);
    setError("");
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        ...(form.description && { description: form.description }),
        ...(form.parentId && { parentId: form.parentId }),
      };
      if (!editTarget) {
        await api.post("/category", payload);
      } else {
        await api.patch(`/category/${editTarget.id}`, payload);
      }
      closeDrawer();
      fetchCategories();
    } catch (err) {
      setError(extractError(err) || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Products using it may be affected.")) return;
    setDeleting(id);
    setError("");
    try {
      await api.delete(`/category/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(extractError(err) || "Failed to delete category");
    } finally {
      setDeleting(null);
    }
  }

  const parentOptions = categories.filter((c) => c.id !== editTarget?.id);
  const roots = categories.filter((c) => !c.parentId);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">Management</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-900">Categories</h1>
        </div>
        <button onClick={openCreate} className={cls.btnOrange + " px-5 py-2.5"}>+ New Category</button>
      </div>

      {error && <p className="mb-4 border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      ) : roots.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-400">No categories yet — create your first one</p>
      ) : (
        <div className="border border-zinc-100 bg-white shadow-sm divide-y divide-zinc-100">
          {roots.map((root) => {
            const kids = root.children ?? [];
            const open = !collapsed.has(root.id);
            return (
              <div key={root.id}>
                <div
                  className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50/60 transition-colors cursor-pointer select-none"
                  onClick={() => kids.length > 0 && toggle(root.id)}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-50 text-zinc-500">
                    {kids.length > 0 ? (
                      <svg className={`h-3 w-3 transition-transform duration-150 ${open ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                    )}
                  </span>
                  <svg className="h-4 w-4 shrink-0 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-zinc-900">{root.name}</span>
                    {root.description && <span className="ml-3 text-xs text-zinc-400 truncate">{root.description}</span>}
                  </div>
                  {kids.length > 0 && (
                    <span className="shrink-0 bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500">{kids.length}</span>
                  )}
                  <div className="shrink-0 flex gap-3" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEdit(root)} className="text-xs font-semibold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">Edit</button>
                    <button onClick={() => handleDelete(root.id)} disabled={deleting === root.id} className="text-xs font-semibold uppercase tracking-widest text-red-400 hover:text-red-700 disabled:opacity-40 transition-colors">
                      {deleting === root.id ? "…" : "Delete"}
                    </button>
                  </div>
                </div>

                {open && kids.map((kid) => (
                  <div key={kid.id} className="flex items-center gap-3 border-t border-zinc-50 bg-zinc-50/40 px-5 py-3 pl-12 hover:bg-zinc-50 transition-colors">
                    <svg className="h-4 w-4 shrink-0 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-zinc-700">{kid.name}</span>
                      {kid.description && <span className="ml-3 text-xs text-zinc-400 truncate">{kid.description}</span>}
                    </div>
                    <span className="shrink-0 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-500">{root.name}</span>
                    <div className="shrink-0 flex gap-3">
                      <button onClick={() => openEdit(kid)} className="text-xs font-semibold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">Edit</button>
                      <button onClick={() => handleDelete(kid.id)} disabled={deleting === kid.id} className="text-xs font-semibold uppercase tracking-widest text-red-400 hover:text-red-700 disabled:opacity-40 transition-colors">
                        {deleting === kid.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-stretch">
          <div className="hidden flex-1 bg-black/40 sm:block" onClick={closeDrawer} />
          <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-zinc-50 shadow-2xl sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:border-y-0 sm:border-r-0 sm:border-l">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
                  {editTarget ? "Edit" : "New"}
                </p>
                <h2 className="text-lg font-extrabold tracking-tight text-zinc-900">
                  {editTarget ? "Edit Category" : "Create Category"}
                </h2>
              </div>
              <button
                onClick={closeDrawer}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
              <div className="flex-1 space-y-5 px-6 py-6">
                <div>
                  <label className={cls.label}>Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={cls.input}
                    placeholder="e.g. Shampoos"
                  />
                </div>
                <div>
                  <label className={cls.label}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className={`${cls.input} resize-none`}
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <label className={cls.label}>Parent Category</label>
                  <select
                    value={form.parentId}
                    onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                    className={cls.input}
                  >
                    <option value="">None (top-level)</option>
                    {parentOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {error && <p className={cls.errorBox}>{error}</p>}
              </div>

              {/* Footer */}
              <div className="border-t border-zinc-200 bg-white px-6 py-4 flex gap-3">
                <button type="submit" disabled={submitting} className={cls.btnOrange + " flex-1 py-2.5"}>
                  {submitting ? "Saving…" : editTarget ? "Save Changes" : "Create Category"}
                </button>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
