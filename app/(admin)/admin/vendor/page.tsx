"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import type { Vendor } from "@/lib/types";
import { cls } from "@/lib/theme";
import AdminTable from "@/components/admin/AdminTable";

interface FormState {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const EMPTY: FormState = { name: "", email: "", phone: "", address: "" };

function extractError(err: unknown): string {
  if (err instanceof Error && "response" in err) {
    const r = (err as { response?: { data?: { error?: string } } }).response;
    if (r?.data?.error) return r.data.error;
  }
  return "";
}

export default function VendorPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Vendor | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ data: Vendor[] }>("/vendor");
      setVendors(data.data);
    } catch {
      setError("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  function openCreate() {
    setForm(EMPTY);
    setEditTarget(null);
    setError("");
    setDrawerOpen(true);
  }

  function openEdit(v: Vendor) {
    setForm({ name: v.name, email: v.email, phone: v.phone ?? "", address: v.address ?? "" });
    setEditTarget(v);
    setError("");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditTarget(null);
    setError("");
  }

  async function useCurrentLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const a = data.address ?? {};
          const parts = [
            [a.house_number, a.road].filter(Boolean).join(" "),
            a.neighbourhood ?? a.suburb ?? "",
            a.city ?? a.town ?? a.village ?? a.county ?? "",
            a.state ?? "",
            a.postcode ?? "",
            a.country ?? "",
          ].filter(Boolean);
          setForm((f) => ({ ...f, address: parts.join(", ") }));
        } catch {
          setError("Could not fetch address from location");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError("Location access denied");
        setLocating(false);
      }
    );
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        email: form.email,
        ...(form.phone && { phone: form.phone }),
        ...(form.address && { address: form.address }),
      };
      if (!editTarget) {
        await api.post("/vendor", payload);
      } else {
        await api.patch(`/vendor/${editTarget.id}`, payload);
      }
      closeDrawer();
      fetchVendors();
    } catch (err) {
      setError(extractError(err) || "Failed to save vendor");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this vendor? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.delete(`/vendor/${id}`);
      setVendors((prev) => prev.filter((v) => v.id !== id));
    } catch {
      setError("Failed to delete vendor");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">Management</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-900">Vendors</h1>
        </div>
        <button onClick={openCreate} className={cls.btnOrange + " px-5 py-2.5"}>+ Add Vendor</button>
      </div>

      {error && (
        <p className="mb-4 border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <AdminTable
        columns={["Vendor", "Email", "Phone", "Actions"]}
        loading={loading}
        isEmpty={vendors.length === 0}
        empty="No vendors yet — add your first supplier"
      >
        {vendors.map((v) => (
          <tr key={v.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60 transition-colors">
            <td className="px-5 py-4 text-sm font-semibold text-zinc-900">{v.name}</td>
            <td className="px-5 py-4 text-sm text-zinc-500">{v.email}</td>
            <td className="px-5 py-4 text-sm text-zinc-500">{v.phone ?? "—"}</td>
            <td className="px-5 py-4">
              <div className="flex gap-3">
                <button
                  onClick={() => openEdit(v)}
                  className="text-xs font-semibold uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-900"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(v.id)}
                  disabled={deleting === v.id}
                  className="text-xs font-semibold uppercase tracking-widest text-red-400 transition-colors hover:text-red-700 disabled:opacity-40"
                >
                  {deleting === v.id ? "…" : "Delete"}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

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
                  {editTarget ? "Edit Vendor" : "Add Vendor"}
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
                    placeholder="Vendor / supplier name"
                  />
                </div>
                <div>
                  <label className={cls.label}>Email *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={cls.input}
                    placeholder="contact@vendor.com"
                  />
                </div>
                <div>
                  <label className={cls.label}>Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={cls.input}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className={cls.label}>Address</label>
                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      disabled={locating}
                      className="inline-flex items-center gap-1 text-xs font-medium text-orange-500 transition-colors hover:text-orange-700 disabled:opacity-50"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {locating ? "Locating…" : "Use Current Location"}
                    </button>
                  </div>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    rows={3}
                    className={`${cls.input} resize-none`}
                    placeholder="Warehouse / office address"
                  />
                </div>

                {error && <p className={cls.errorBox}>{error}</p>}
              </div>

              {/* Footer */}
              <div className="border-t border-zinc-200 bg-white px-6 py-4 flex gap-3">
                <button type="submit" disabled={submitting} className={cls.btnOrange + " flex-1 py-2.5"}>
                  {submitting ? "Saving…" : editTarget ? "Save Changes" : "Add Vendor"}
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
