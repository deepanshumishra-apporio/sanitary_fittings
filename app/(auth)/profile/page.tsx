"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageSpinner } from "@/components/ui/Spinner";
import { cls } from "@/lib/theme";
import { fmtDate } from "@/lib/format";

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: "Customer",
  SUBADMIN: "Staff",
  ADMIN: "Admin",
};

function ChevronIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

export default function ProfilePage() {
  const { user, loading, logout } = useAuth(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");

  if (loading) return <PageSpinner />;
  if (!user) return null;

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!name.trim() && !phone.trim()) return;
    setSaving(true);
    setSaveMsg("");
    setSaveError("");
    try {
      await api.patch("/auth/me", {
        ...(name.trim() && { name: name.trim() }),
        ...(phone.trim() && { phone: phone.trim() }),
      });
      setSaveMsg("Profile updated successfully.");
      setName("");
      setPhone("");
      setTimeout(() => setSaveMsg(""), 4000);
    } catch {
      setSaveError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const isAdmin = user.role === "ADMIN" || user.role === "SUBADMIN";
  const initials = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  const roleBadgeClass =
    user.role === "ADMIN"
      ? "bg-orange-100 text-orange-700"
      : user.role === "SUBADMIN"
        ? "bg-orange-50 text-orange-600"
        : "bg-zinc-100 text-zinc-600";

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">Account</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-900">Profile</h1>
          <p className="mt-1 text-sm text-zinc-400">Manage your account details and admin access.</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="border border-zinc-100 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-orange-50 text-2xl font-extrabold text-orange-600">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">User</p>
                <h2 className="mt-1 truncate text-xl font-extrabold tracking-tight text-zinc-900">
                  {user.name ?? "Your Profile"}
                </h2>
                <p className="mt-1 break-all text-sm text-zinc-500">{user.email}</p>
              </div>
              <span className={`shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${roleBadgeClass}`}>
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
            </div>
          </div>

          <div className="grid gap-px bg-zinc-100 sm:grid-cols-3">
            {[
              { label: "Role", value: ROLE_LABEL[user.role] ?? user.role },
              { label: "Joined", value: fmtDate(user.createdAt) },
              { label: "Phone", value: user.phone ?? "-" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="divide-y divide-zinc-100">
            {[
              { label: "Email Address", value: user.email ?? "-" },
              { label: "Full Name", value: user.name ?? "-" },
              { label: "Phone Number", value: user.phone ?? "-" },
            ].map(({ label, value }) => (
              <div key={label} className="px-6 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
                <p className="mt-1 break-all text-sm font-medium text-zinc-900">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-zinc-100 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-900">Edit Profile</p>
            <p className="mt-1 text-xs text-zinc-400">Leave any field blank to keep the current value.</p>
          </div>

          <form onSubmit={handleSave} className="space-y-5 px-6 py-6">
            <div>
              <label className={cls.label}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={user.name ?? "Full name"}
                className={cls.input}
              />
            </div>

            <div>
              <label className={cls.label}>Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={user.phone ?? "+91 00000 00000"}
                className={cls.input}
              />
            </div>

            {saveError && <p className={cls.errorBox}>{saveError}</p>}
            {saveMsg && (
              <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {saveMsg}
              </p>
            )}

            <div className="flex flex-col gap-3 border-t border-zinc-100 pt-5">
              {isAdmin && (
                <Link
                  href="/admin/analytic"
                  className="flex items-center justify-between border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm transition-colors hover:bg-zinc-100"
                >
                  <div>
                    <p className="font-semibold text-zinc-900">Admin Dashboard</p>
                    <p className="mt-0.5 text-xs text-zinc-500">Return to analytics and management</p>
                  </div>
                  <ChevronIcon />
                </Link>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving || (!name.trim() && !phone.trim())}
                  className={cls.btnOrange + " flex-1 py-3.5"}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="flex-1 border border-zinc-200 bg-white px-6 py-3.5 text-xs font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
