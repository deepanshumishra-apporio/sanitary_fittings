"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { User, PaginatedMeta } from "@/lib/types";
import AdminTable from "@/components/admin/AdminTable";
import Pagination from "@/components/admin/Pagination";
import { useAuth } from "@/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToastItem { id: number; message: string; type: "success" | "error"; }

interface CreateForm {
  name: string; email: string; phone: string; password: string;
}

const BLANK_FORM: CreateForm = { name: "", email: "", phone: "", password: "" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractError(err: unknown): string {
  const r = (err as { response?: { data?: { error?: string } } }).response;
  return r?.data?.error ?? "Something went wrong";
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className={[
      "flex items-center gap-3 border px-4 py-3 text-sm font-medium shadow-md",
      toast.type === "success"
        ? "border-green-200 bg-green-50 text-green-800"
        : "border-red-100 bg-red-50 text-red-700",
    ].join(" ")}>
      <span className="flex-1">{toast.message}</span>
      <button onClick={onDismiss} className="shrink-0 opacity-50 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  title, body, confirmLabel, danger, onConfirm, onCancel,
}: {
  title: string; body: string; confirmLabel: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancel]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-sm border border-zinc-200 bg-white shadow-xl">
        <div className="border-b border-zinc-100 px-6 py-4">
          <p className="text-sm font-semibold text-zinc-900">{title}</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-zinc-600">{body}</p>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 px-6 py-4">
          <button
            onClick={onCancel}
            className="border border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={[
              "px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white",
              danger ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600",
            ].join(" ")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Subadmin Drawer ───────────────────────────────────────────────────

function CreateSubadminDrawer({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CreateForm>(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  function set(field: keyof CreateForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/auth/users/subadmin", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        name: form.name.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch">
      <div className="hidden flex-1 bg-black/40 sm:block" onClick={onClose} />
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:border-y-0 sm:border-r-0 sm:border-l">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Admin</p>
            <h2 className="mt-0.5 text-base font-extrabold tracking-tight text-zinc-900">
              Create Subadmin
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {error && (
              <p className="border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </p>
            )}

            <Field
              label="Full Name"
              value={form.name}
              onChange={set("name")}
              placeholder="Jane Doe"
              autoFocus
            />
            <Field
              label="Email Address"
              type="email"
              required
              value={form.email}
              onChange={set("email")}
              placeholder="jane@example.com"
            />
            <Field
              label="Phone (optional)"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+91 98765 43210"
              maxLength={30}
            />

            <div className="border-t border-zinc-100 pt-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Login Credentials
              </p>
              <div className="space-y-4">
                <Field
                  label="Password"
                  type="password"
                  required
                  value={form.password}
                  onChange={set("password")}
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div className="border border-orange-100 bg-orange-50 px-4 py-3">
              <p className="text-xs text-orange-700">
                The account will be created with <strong>Subadmin</strong> role and email pre-verified.
                Share the credentials with the staff member.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-zinc-100 px-6 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-zinc-200 py-2.5 text-xs font-semibold uppercase tracking-widest text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !form.email || !form.password}
                className="flex-1 bg-orange-500 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Creating…" : "Create Account"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", required, autoFocus, maxLength,
}: {
  label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; required?: boolean; autoFocus?: boolean; maxLength?: number;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      <div className="relative">
        <input
          type={isPassword ? (show ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          maxLength={maxLength}
          className={`w-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none${isPassword ? " pr-9" : ""}`}
        />
        {isPassword && (
          <button type="button" tabIndex={-1} onClick={() => setShow((s) => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors">
            {show
              ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
            }
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Edit User Drawer ─────────────────────────────────────────────────────────

function EditUserDrawer({
  user,
  onClose,
  onSaved,
}: {
  user: User;
  onClose: () => void;
  onSaved: (updated: User) => void;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    if (newPassword && newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.patch<{ data: User }>(`/auth/users/${user.id}`, {
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      if (newPassword) {
        await api.patch(`/auth/users/${user.id}/password`, { password: newPassword });
      }
      onSaved(data.data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch">
      <div className="hidden flex-1 bg-black/40 sm:block" onClick={onClose} />
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:border-y-0 sm:border-r-0 sm:border-l">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Edit User</p>
            <h2 className="mt-0.5 text-base font-extrabold tracking-tight text-zinc-900">
              {user.name ?? user.email}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">{user.email} · {user.role}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {error && (
              <p className="border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}
            <Field
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              autoFocus
            />
            <Field
              label="Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              maxLength={30}
            />
            <div className="border-t border-zinc-100 pt-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Change Password
              </p>
              <Field
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-zinc-100 px-6 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-zinc-200 py-2.5 text-xs font-semibold uppercase tracking-widest text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-orange-500 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ user, orange }: { user: User; orange?: boolean }) {
  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();
  return (
    <div className={[
      "flex h-8 w-8 shrink-0 items-center justify-center text-xs font-bold",
      orange ? "bg-orange-100 text-orange-600" : "bg-zinc-100 text-zinc-600",
    ].join(" ")}>
      {initial}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const COLS = ["Name", "Email", "Phone", "Since", "Action"];

export default function SubadminPage() {
  const { user: self, loading: authLoading } = useAuth();

  const [subadmins, setSubadmins] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loadingList, setLoadingList] = useState(true);
  const [inFlight, setInFlight] = useState<string | null>(null);
  const [pendingDemote, setPendingDemote] = useState<User | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);

  // Change-role section
  const [roleSearch, setRoleSearch] = useState("");
  const [roleResults, setRoleResults] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [roleDraft, setRoleDraft] = useState<Record<string, "CUSTOMER" | "SUBADMIN">>({});
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const toastId = useRef(0);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roleDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushToast = useCallback((message: string, type: ToastItem["type"]) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback(
    (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    []
  );

  const fetchSubadmins = useCallback(async (q: string, pg: number) => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams({ role: "SUBADMIN", limit: "20", page: String(pg) });
      if (q.trim()) params.set("search", q.trim());
      const { data } = await api.get<{ data: User[]; meta: PaginatedMeta }>(
        `/auth/users?${params}`
      );
      setSubadmins(data.data);
      setMeta(data.meta);
    } catch {
      pushToast("Failed to load subadmins", "error");
    } finally {
      setLoadingList(false);
    }
  }, [pushToast]);

  useEffect(() => { fetchSubadmins("", 1); }, [fetchSubadmins]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchSubadmins(value, 1), 300);
  }

  async function demote(userId: string) {
    setPendingDemote(null);
    setInFlight(userId);
    try {
      await api.patch(`/auth/users/${userId}/role`, { role: "CUSTOMER" });
      pushToast("Subadmin demoted successfully", "success");
      fetchSubadmins(search, page);
    } catch (err) {
      pushToast(extractError(err) || "Failed to demote", "error");
    } finally {
      setInFlight(null);
    }
  }

  function handleEditSaved(updated: User) {
    setEditTarget(null);
    pushToast("User details updated", "success");
    setSubadmins((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setRoleResults((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }

  function handleDrawerCreated() {
    setShowDrawer(false);
    pushToast("Subadmin account created successfully", "success");
    fetchSubadmins(search, page);
  }

  function handleRoleSearch(value: string) {
    setRoleSearch(value);
    if (roleDebounce.current) clearTimeout(roleDebounce.current);
    if (!value.trim()) { setRoleResults([]); return; }
    roleDebounce.current = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const params = new URLSearchParams({ search: value.trim(), limit: "10" });
        const { data } = await api.get<{ data: User[] }>(`/auth/users?${params}`);
        setRoleResults(data.data);
        setRoleDraft((prev) => {
          const next = { ...prev };
          data.data.forEach((u) => {
            if (!(u.id in next)) next[u.id] = u.role as "CUSTOMER" | "SUBADMIN";
          });
          return next;
        });
      } catch {
        pushToast("Failed to search users", "error");
      } finally {
        setSearchingUsers(false);
      }
    }, 350);
  }

  async function applyRoleChange(userId: string) {
    const role = roleDraft[userId];
    if (!role) return;
    setChangingRole(userId);
    try {
      await api.patch(`/auth/users/${userId}/role`, { role });
      setRoleResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
      pushToast("Role updated successfully", "success");
      fetchSubadmins(search, page);
    } catch (err) {
      pushToast(extractError(err) || "Failed to update role", "error");
    } finally {
      setChangingRole(null);
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (self?.role !== "ADMIN") {
    return (
      <div className="p-8">
        <div className="border border-zinc-100 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-zinc-500">Only admins can manage subadmins.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex w-80 flex-col gap-2">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
          ))}
        </div>
      )}

      {/* Demote confirm */}
      {pendingDemote && (
        <ConfirmModal
          title="Demote Subadmin"
          body={`"${pendingDemote.name ?? pendingDemote.email}" will lose admin panel access immediately.`}
          confirmLabel="Demote"
          danger
          onCancel={() => setPendingDemote(null)}
          onConfirm={() => demote(pendingDemote.id)}
        />
      )}

      {/* Edit user drawer */}
      {editTarget && (
        <EditUserDrawer
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleEditSaved}
        />
      )}

      {/* Create drawer */}
      {showDrawer && (
        <CreateSubadminDrawer
          onClose={() => setShowDrawer(false)}
          onCreated={handleDrawerCreated}
        />
      )}

      <div className="p-4 sm:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
              Management
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-900">
              Subadmin Management
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Create and manage staff accounts.
            </p>
          </div>
          <button
            onClick={() => setShowDrawer(true)}
            className="flex items-center gap-2 bg-orange-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-600"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Subadmin
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none"
          />
        </div>

        {/* Table */}
        <AdminTable
          columns={COLS}
          loading={loadingList}
          isEmpty={subadmins.length === 0}
          empty={search ? "No subadmins match your search" : "No subadmins yet — create one above"}
        >
          {subadmins.map((u) => (
            <tr
              key={u.id}
              className="border-b border-zinc-50 last:border-0 transition-colors hover:bg-zinc-50/60"
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar user={u} orange />
                  <span className="text-sm font-semibold text-zinc-900">
                    {u.name ?? "—"}
                    {u.id === self.id && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-orange-500">
                        You
                      </span>
                    )}
                  </span>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-zinc-600">{u.email ?? "—"}</td>
              <td className="px-5 py-4 text-sm text-zinc-400">{u.phone ?? "—"}</td>
              <td className="px-5 py-4 text-sm text-zinc-400">{fmtDate(u.createdAt)}</td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditTarget(u)}
                    className="border border-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                  >
                    Edit
                  </button>
                  {u.id === self.id ? (
                    <span className="text-xs italic text-zinc-300">Cannot demote self</span>
                  ) : (
                    <button
                      disabled={inFlight === u.id}
                      onClick={() => setPendingDemote(u)}
                      className="border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-red-500 transition-colors hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {inFlight === u.id ? "…" : "Demote"}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>

        <Pagination
          meta={meta}
          page={page}
          onPage={(p) => { setPage(p); fetchSubadmins(search, p); }}
        />

        {/* ── Change User Role ─────────────────────────────────────────── */}
        <div className="mt-10 border-t border-zinc-100 pt-8">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
              Role Management
            </p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight text-zinc-900">
              Change User Role
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Search any user and promote them to Subadmin or demote back to Customer.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search user by name or email…"
              value={roleSearch}
              onChange={(e) => handleRoleSearch(e.target.value)}
              className="w-full border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none"
            />
            {searchingUsers && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent block" />
              </span>
            )}
          </div>

          {/* Results */}
          {roleResults.length > 0 && (
            <div className="border border-zinc-200 bg-white divide-y divide-zinc-50">
              {roleResults.map((u) => {
                const current = u.role;
                const draft = roleDraft[u.id] ?? current;
                const isSelf = u.id === self.id;
                const isAdmin = current === "ADMIN";
                const saving = changingRole === u.id;
                const unchanged = draft === current;
                return (
                  <div key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <Avatar user={u} orange={current === "SUBADMIN"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {u.name ?? u.email}
                        {isSelf && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-orange-500">
                            You
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-zinc-400">{u.name ? u.email : ""}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => setEditTarget(u)}
                        className="border border-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                      >
                        Edit
                      </button>
                      {isAdmin || isSelf ? (
                        <span className={[
                          "px-3 py-1.5 text-xs font-bold uppercase tracking-widest",
                          isAdmin ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500",
                        ].join(" ")}>
                          {current}
                        </span>
                      ) : (
                        <>
                          <select
                            value={draft}
                            onChange={(e) =>
                              setRoleDraft((prev) => ({ ...prev, [u.id]: e.target.value as "CUSTOMER" | "SUBADMIN" }))
                            }
                            className="border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none"
                          >
                            <option value="CUSTOMER">Customer</option>
                            <option value="SUBADMIN">Subadmin</option>
                          </select>
                          <button
                            onClick={() => applyRoleChange(u.id)}
                            disabled={saving || unchanged}
                            className="bg-orange-500 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {saving ? "Saving…" : "Save"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {roleSearch.trim() && !searchingUsers && roleResults.length === 0 && (
            <p className="py-6 text-center text-sm text-zinc-400">No users found for &quot;{roleSearch}&quot;</p>
          )}
        </div>
      </div>
    </>
  );
}
