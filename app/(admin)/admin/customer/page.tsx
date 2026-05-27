"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { fmtDate, fmtPrice } from "@/lib/format";
import type { User, PaginatedMeta, OrderStatus, PaymentStatus } from "@/lib/types";
import { downloadInvoice } from "@/lib/invoice";
import AdminTable from "@/components/admin/AdminTable";
import Pagination from "@/components/admin/Pagination";

type CustomerOrder = {
  id: string;
  userId: string;
  addressId: string;
  totalPrice: number;
  discount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  address: {
    id: string;
    userId: string;
    name: string;
    phone: string | null;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    zip: string;
    country: string;
    isDefault: boolean;
  } | null;
  payment: {
    id: string;
    amount: number;
    status: PaymentStatus;
    createdAt: string;
    updatedAt: string;
  } | null;
  items: Array<{
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    price: number;
    discount: number;
    product: {
      id: string;
      name: string;
      price: number;
      discount: number;
      images: string[];
    };
  }>;
};

type CustomerDetail = User & {
  orders: CustomerOrder[];
};

const COLUMNS = ["Name", "Email", "Phone", "Joined", "Action"];

function extractError(err: unknown): string {
  const r = (err as { response?: { data?: { error?: string } } }).response;
  return r?.data?.error ?? "Something went wrong";
}

function exportCsv(users: User[]) {
  const header = ["Name", "Email", "Phone", "Joined"];
  const rows = users.map((u) => [
    u.name ?? "",
    u.email ?? "",
    u.phone ?? "",
    fmtDate(u.createdAt),
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

function statusTone(status: OrderStatus) {
  switch (status) {
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";
    case "PLACED":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-zinc-50 text-zinc-700 border-zinc-200";
  }
}

function DrawerShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch">
      <div className="hidden flex-1 bg-black/40 sm:block" onClick={onClose} />
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:h-full sm:max-h-none sm:max-w-2xl sm:rounded-none sm:border-y-0 sm:border-r-0 sm:border-l">
        {children}
      </div>
    </div>
  );
}

function ViewDrawer({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get<{ data: CustomerDetail }>(`/auth/users/${userId}`);
        if (active) setDetail(data.data);
      } catch (err) {
        if (active) setError(extractError(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <DrawerShell onClose={onClose}>
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Customer Detail</p>
          <h2 className="mt-0.5 text-base font-extrabold tracking-tight text-zinc-900">
            {detail?.name ?? detail?.email ?? "Customer"}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">{detail?.email ?? "Loading..."}</p>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {loading && <p className="text-sm text-zinc-500">Loading customer details...</p>}
        {error && <p className="border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        {detail && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-zinc-100 bg-zinc-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Phone</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{detail.phone ?? "—"}</p>
              </div>
              <div className="border border-zinc-100 bg-zinc-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Joined</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{fmtDate(detail.createdAt)}</p>
              </div>
              <div className="border border-zinc-100 bg-zinc-50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Orders</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{detail.orders.length}</p>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-zinc-900">Purchases</h3>
                <span className="text-xs text-zinc-400">{detail.orders.length} orders</span>
              </div>

              {detail.orders.length === 0 ? (
                <div className="border border-dashed border-zinc-200 px-4 py-6 text-sm text-zinc-500">
                  No purchases yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {detail.orders.map((order) => (
                    <div key={order.id} className="border border-zinc-200 bg-white">
                      <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                            Order #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500">{fmtDate(order.createdAt)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${statusTone(order.status)}`}>
                            {order.status}
                          </span>
                          <span className="bg-zinc-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                            {fmtPrice(order.totalPrice)}
                          </span>
                          <button
                            onClick={() =>
                              downloadInvoice({
                                ...order,
                                userId: detail.id,
                                addressId: order.address?.id ?? "",
                                user: {
                                  id: detail.id,
                                  name: detail.name,
                                  email: detail.email,
                                },
                              })
                            }
                            className="border border-zinc-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                          >
                            Invoice
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 px-4 py-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-start justify-between gap-3 border-b border-zinc-50 pb-3 last:border-0 last:pb-0">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-zinc-900">{item.product.name}</p>
                              <p className="mt-1 text-xs text-zinc-500">
                                Qty {item.quantity} × {fmtPrice(item.price - item.discount)}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-semibold text-zinc-900">
                              {fmtPrice((item.price - item.discount) * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DrawerShell>
  );
}

function EditDrawer({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: (u: User) => void }) {
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const { data } = await api.patch<{ data: User }>(`/auth/users/${user.id}`, {
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      onSaved(data.data);
    } catch (err) { setError(extractError(err)); }
    finally { setSaving(false); }
  }

  return (
    <DrawerShell onClose={onClose}>
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Edit Customer</p>
          <h2 className="mt-0.5 text-base font-extrabold tracking-tight text-zinc-900">{user.name ?? user.email}</h2>
          <p className="mt-0.5 text-xs text-zinc-400">{user.email}</p>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {error && <p className="border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
          <FieldInput label="Full Name" value={name} onChange={setName} placeholder="Jane Doe" autoFocus />
          <FieldInput label="Phone" value={phone} onChange={setPhone} placeholder="+91 98765 43210" maxLength={30} />
        </div>
        <div className="shrink-0 border-t border-zinc-100 px-6 py-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 border border-zinc-200 py-2.5 text-xs font-semibold uppercase tracking-widest text-zinc-600 hover:border-zinc-900">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 bg-orange-500 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-orange-600 disabled:opacity-40">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </DrawerShell>
  );
}

function FieldInput({ label, value, onChange, placeholder, autoFocus, maxLength }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; autoFocus?: boolean; maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</label>
      <input
        type="text" value={value} placeholder={placeholder} autoFocus={autoFocus} maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none"
      />
    </div>
  );
}

export default function CustomerPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [viewTargetId, setViewTargetId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef(search);
  searchRef.current = search;

  const fetchUsers = useCallback(async (q: string, pg: number) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(pg), limit: "20", role: "CUSTOMER" });
      if (q) params.set("search", q);
      const { data } = await api.get<{ data: User[]; meta: PaginatedMeta }>(`/auth/users?${params}`);
      setUsers(data.data);
      setMeta(data.meta);
    } catch {
      setError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers("", 1); }, [fetchUsers]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(value, 1), 300);
  }

  function handlePageChange(p: number) {
    setPage(p);
    fetchUsers(searchRef.current, p);
  }

  function handleEditSaved(updated: User) {
    setEditTarget(null);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }

  return (
    <>
      {editTarget && <EditDrawer user={editTarget} onClose={() => setEditTarget(null)} onSaved={handleEditSaved} />}
      {viewTargetId && <ViewDrawer userId={viewTargetId} onClose={() => setViewTargetId(null)} />}

      <div className="p-4 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">Management</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-900">Customers</h1>
            <p className="mt-1 text-sm text-zinc-500">{meta.total} total registered</p>
          </div>
          <button
            onClick={() => exportCsv(users)}
            disabled={users.length === 0}
            className="flex items-center gap-2 border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900 disabled:opacity-40"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
        </div>

        <div className="relative mb-5">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none transition-colors"
          />
        </div>

        {error && <p className="mb-4 border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <AdminTable columns={COLUMNS} loading={loading} isEmpty={users.length === 0} empty="No customers found">
          {users.map((u) => {
            const initials = (u.name ?? u.email ?? "?").charAt(0).toUpperCase();
            return (
              <tr key={u.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-zinc-100 text-xs font-bold text-zinc-600">{initials}</div>
                    <span className="text-sm font-semibold text-zinc-900">{u.name ?? "—"}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-zinc-600">{u.email ?? "—"}</td>
                <td className="px-5 py-4 text-sm text-zinc-600">{u.phone ?? "—"}</td>
                <td className="px-5 py-4 text-sm text-zinc-400">{fmtDate(u.createdAt)}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setViewTargetId(u.id)}
                      className="border border-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setEditTarget(u)}
                      className="border border-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminTable>

        <Pagination meta={meta} page={page} onPage={handlePageChange} />
      </div>
    </>
  );
}
