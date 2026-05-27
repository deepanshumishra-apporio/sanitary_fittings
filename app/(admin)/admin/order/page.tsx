"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { fmtPrice, fmtDate } from "@/lib/format";
import type { Order, OrderStatus, PaginatedMeta, PaymentStatus } from "@/lib/types";
import { OrderStatusBadge } from "@/components/ui/Badge";
import AdminTable from "@/components/admin/AdminTable";
import Pagination from "@/components/admin/Pagination";
import ManualOrderDrawer from "@/components/admin/ManualOrderDrawer";
import { downloadInvoice } from "@/lib/invoice";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminOrder extends Order {
  user?: { id: string; name: string | null; email: string | null };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_STATUSES: OrderStatus[] = ["PLACED", "CANCELLED"];
const PAYMENT_STATUSES: PaymentStatus[] = ["UNPAID", "PAID"];

const COLUMNS = ["Order ID", "Customer", "Amount", "Status", "Date", "Action", ""];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<AdminOrder | null>(null);
  const [statusDraft, setStatusDraft] = useState<Record<string, OrderStatus>>({});
  const [paymentDraft, setPaymentDraft] = useState<Record<string, PaymentStatus>>({});
  const [showDrawer, setShowDrawer] = useState(false);
  const [dateRange, setDateRange] = useState<"all" | "today" | "7d" | "30d">("all");

  function dateRangeParams(r: typeof dateRange) {
    const now = new Date();
    if (r === "today") { const s = new Date(now); s.setHours(0,0,0,0); return { from: s.toISOString(), to: now.toISOString() }; }
    if (r === "7d") return { from: new Date(Date.now() - 6 * 86400000).toISOString(), to: now.toISOString() };
    if (r === "30d") return { from: new Date(Date.now() - 29 * 86400000).toISOString(), to: now.toISOString() };
    return {};
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const { from, to } = dateRangeParams(dateRange);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const { data } = await api.get<{ data: AdminOrder[]; meta: PaginatedMeta }>(`/order?${params}`);
      setOrders(data.data);
      setMeta(data.meta);
    } catch {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, dateRange]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function applyStatusDraft(orderId: string) {
    const newStatus = statusDraft[orderId];
    if (!newStatus) return;
    setUpdating(orderId);
    try {
      await api.patch(`/order/${orderId}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      setDetailTarget((prev) => (
        prev && prev.id === orderId ? { ...prev, status: newStatus } : prev
      ));
    } catch {
      setError("Failed to update status");
    } finally {
      setUpdating(null);
    }
  }

  async function applyStatusDraftWithValue(orderId: string, newStatus: OrderStatus) {
    setUpdating(orderId);
    try {
      await api.patch(`/order/${orderId}/status`, { status: newStatus });
      setStatusDraft((prev) => ({ ...prev, [orderId]: newStatus }));
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      setDetailTarget((prev) => (
        prev && prev.id === orderId ? { ...prev, status: newStatus } : prev
      ));
    } catch {
      setError("Failed to update status");
    } finally {
      setUpdating(null);
    }
  }

  async function applyPaymentDraft(orderId: string) {
    const newStatus = paymentDraft[orderId];
    if (!newStatus) return;
    setUpdating(orderId);
    try {
      await api.patch(`/order/${orderId}/payment-status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (
        o.id === orderId
          ? {
              ...o,
              payment: o.payment
                ? { ...o.payment, status: newStatus }
                : null,
            }
          : o
      )));
      setDetailTarget((prev) => (
        prev && prev.id === orderId && prev.payment
          ? { ...prev, payment: { ...prev.payment, status: newStatus } }
          : prev
      ));
    } catch {
      setError("Failed to update payment status");
    } finally {
      setUpdating(null);
    }
  }

  function handleFilterChange(s: string) { setStatusFilter(s); setPage(1); }
  function handleDateRange(r: typeof dateRange) { setDateRange(r); setPage(1); }
  function handleDrawerCreated() { setShowDrawer(false); fetchOrders(); }

  function exportCsv() {
    const header = ["Order ID", "Customer", "Email", "Status", "Total", "Date"];
    const rows = orders.map((o) => [
      o.id,
      o.user?.name ?? "",
      o.user?.email ?? "",
      o.status,
      o.totalPrice.toFixed(2),
      new Date(o.createdAt).toLocaleDateString("en-IN"),
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <>
      {showDrawer && (
        <ManualOrderDrawer onClose={() => setShowDrawer(false)} onCreated={handleDrawerCreated} />
      )}
      {detailTarget && (
        <OrderDetailDrawer
          order={detailTarget}
          statusDraft={statusDraft}
          paymentDraft={paymentDraft}
          updating={updating}
          onClose={() => setDetailTarget(null)}
          onStatusDraftChange={(id, s) => setStatusDraft((prev) => ({ ...prev, [id]: s }))}
          onPaymentDraftChange={(id, s) => setPaymentDraft((prev) => ({ ...prev, [id]: s }))}
          onApplyStatus={applyStatusDraft}
          onApplyPaymentStatus={applyPaymentDraft}
        />
      )}

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">Management</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-900">Orders</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">{meta.total} total</span>
            <button
              onClick={exportCsv}
              disabled={orders.length === 0}
              className="flex items-center gap-1.5 border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900 disabled:opacity-40"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              CSV
            </button>
            <button
              onClick={() => setShowDrawer(true)}
              className="flex items-center gap-2 bg-orange-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-600"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Order
            </button>
          </div>
        </div>

        {/* Date range filter */}
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
          {(["all", "today", "7d", "30d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleDateRange(r)}
              className={[
                "shrink-0 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors",
                dateRange === r ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-900",
              ].join(" ")}
            >
              {r === "all" ? "All Time" : r === "today" ? "Today" : r === "7d" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>

        {/* Status filter — horizontally scrollable on mobile */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {["", ...ALL_STATUSES].map((s) => (
            <button
              key={s || "__all"}
              onClick={() => handleFilterChange(s)}
              className={[
                "shrink-0 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors",
                statusFilter === s
                  ? s === "" ? "bg-zinc-900 text-white" : "bg-orange-500 text-white"
                  : "bg-white text-zinc-500 ring-1 ring-zinc-200 hover:ring-zinc-400",
              ].join(" ")}
            >
              {s === "" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <p className="py-16 text-center text-sm text-zinc-400">No orders found</p>
        ) : (
          <>
            {/* ── Mobile cards (< md) ───────────────────────── */}
            <div className="space-y-3 md:hidden">
              {orders.map((o) => {
                const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);
                const customerName = o.user?.name ?? o.address?.name ?? "—";
                return (
                  <div key={o.id} className="overflow-hidden border border-zinc-100 bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-3 px-4 pt-4">
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] font-bold text-zinc-400">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-zinc-900">{customerName}</p>
                        <p className="mt-0.5 text-xs text-zinc-400">{fmtDate(o.createdAt)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-base font-extrabold text-zinc-900">{fmtPrice(o.totalPrice)}</p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-50 px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                      {o.status === "PLACED" && (
                        <button
                          disabled={updating === o.id}
                          onClick={() => applyStatusDraftWithValue(o.id, "CANCELLED")}
                          className="bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-600 transition-colors hover:bg-orange-500 hover:text-white disabled:opacity-40"
                        >
                          {updating === o.id ? "…" : "Cancel"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDetailTarget(o)}
                        className="ml-auto border border-zinc-200 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-zinc-600 transition-colors hover:border-zinc-900"
                      >
                        Details
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* ── Desktop table (md+) ───────────────────────── */}
            <div className="hidden md:block">
              <AdminTable columns={COLUMNS} isEmpty={false} empty="">
                {orders.map((o) => {
                  const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);
                  const customerName = o.user?.name ?? o.address?.name ?? "—";
                  const customerEmail = o.user?.email ?? "—";
                  return (
                    <tr key={o.id} className="border-b border-zinc-50 transition-colors hover:bg-zinc-50/60">
                      <td className="px-5 py-4">
                          <div className="font-mono text-xs font-semibold text-zinc-700">
                            #{o.id.slice(0, 8).toUpperCase()}
                          </div>
                          <div className="mt-0.5 hidden font-mono text-[10px] text-zinc-300 lg:block">
                            {o.id}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="block text-sm font-medium text-zinc-900">{customerName}</span>
                          <span className="mt-0.5 block text-xs text-zinc-400">{customerEmail}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm font-bold text-zinc-900">{fmtPrice(o.totalPrice)}</div>
                          <div className="mt-0.5 text-xs text-zinc-400">
                            {itemCount} item{itemCount !== 1 ? "s" : ""}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <OrderStatusBadge status={o.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-zinc-600">{fmtDate(o.createdAt)}</div>
                          <div className="mt-0.5 text-xs text-zinc-400">Upd. {fmtDate(o.updatedAt)}</div>
                        </td>
                        <td className="px-5 py-4">
                          {o.status === "PLACED" ? (
                            <button
                              disabled={updating === o.id}
                              onClick={() => applyStatusDraftWithValue(o.id, "CANCELLED")}
                              className="whitespace-nowrap bg-orange-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-orange-600 transition-colors hover:bg-orange-500 hover:text-white disabled:opacity-40"
                            >
                              {updating === o.id ? "…" : "Cancel"}
                            </button>
                          ) : (
                            <span className="text-xs text-zinc-300">Closed</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setDetailTarget(o)}
                            className="border border-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                          >
                            View
                          </button>
                        </td>
                    </tr>
                  );
                })}
              </AdminTable>
            </div>
          </>
        )}

        <Pagination meta={meta} page={page} onPage={setPage} />
      </div>
    </>
  );
}

// ─── OrderDetail ──────────────────────────────────────────────────────────────

interface OrderDetailProps {
  o: AdminOrder;
  statusDraft: Record<string, OrderStatus>;
  paymentDraft: Record<string, PaymentStatus>;
  updating: string | null;
  onStatusDraftChange: (id: string, s: OrderStatus) => void;
  onPaymentDraftChange: (id: string, s: PaymentStatus) => void;
  onApplyStatus: (id: string) => void;
  onApplyPaymentStatus: (id: string) => void;
}

interface OrderDetailDrawerProps {
  order: AdminOrder;
  statusDraft: Record<string, OrderStatus>;
  paymentDraft: Record<string, PaymentStatus>;
  updating: string | null;
  onClose: () => void;
  onStatusDraftChange: (id: string, s: OrderStatus) => void;
  onPaymentDraftChange: (id: string, s: PaymentStatus) => void;
  onApplyStatus: (id: string) => void;
  onApplyPaymentStatus: (id: string) => void;
}

function OrderDetailDrawer({
  order,
  statusDraft,
  paymentDraft,
  updating,
  onClose,
  onStatusDraftChange,
  onPaymentDraftChange,
  onApplyStatus,
  onApplyPaymentStatus,
}: OrderDetailDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch">
      <div className="hidden flex-1 bg-black/40 sm:block" onClick={onClose} />
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:h-full sm:max-h-none sm:max-w-4xl sm:rounded-none sm:border-y-0 sm:border-r-0 sm:border-l">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Order Detail</p>
            <h2 className="mt-0.5 font-mono text-base font-extrabold tracking-tight text-zinc-900">
              #{order.id.slice(0, 8).toUpperCase()}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">{fmtDate(order.createdAt)}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 transition-colors hover:text-zinc-900" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50">
          <OrderDetail
            o={order}
            statusDraft={statusDraft}
            paymentDraft={paymentDraft}
            updating={updating}
            onStatusDraftChange={onStatusDraftChange}
            onPaymentDraftChange={onPaymentDraftChange}
            onApplyStatus={onApplyStatus}
            onApplyPaymentStatus={onApplyPaymentStatus}
          />
        </div>
      </div>
    </div>
  );
}

function OrderDetail({
  o,
  statusDraft,
  paymentDraft,
  updating,
  onStatusDraftChange,
  onPaymentDraftChange,
  onApplyStatus,
  onApplyPaymentStatus,
}: OrderDetailProps) {
  const subtotal = o.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalDiscount = o.items.reduce((s, i) => s + Math.min(i.discount ?? 0, i.price) * i.quantity, 0);
  const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);
  const customerName = o.user?.name ?? o.address?.name ?? "—";
  const customerEmail = o.user?.email ?? "—";
  const currentDraft = statusDraft[o.id] ?? o.status;
  const currentPaymentDraft = paymentDraft[o.id] ?? o.payment?.status ?? "UNPAID";

  return (
    <div className="bg-white">
      {/* Dark summary bar */}
      <div className="bg-zinc-950 px-4 py-3 text-white">
        {/* Top row: id + invoice */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-orange-300">Detail</p>
            <p className="font-mono text-sm font-bold">#{o.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <button
            onClick={() => downloadInvoice(o)}
            className="flex items-center gap-1.5 border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/80 transition-colors hover:border-orange-400 hover:text-orange-400"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Invoice
          </button>
        </div>
        {/* Metrics row: always 4 cols */}
        <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-4">
          <Metric label="Items" value={String(itemCount)} />
          <Metric label="Subtotal" value={fmtPrice(subtotal)} />
          <Metric label="Discount" value={totalDiscount > 0 ? `−${fmtPrice(totalDiscount)}` : "—"} />
          <Metric label="Total" value={fmtPrice(o.totalPrice)} strong />
        </div>
      </div>

      {/* Body sections — stacked on mobile, 3-col on lg */}
      <div className="divide-y divide-zinc-100 xl:grid xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)_minmax(280px,0.85fr)] xl:divide-x xl:divide-y-0">

        {/* 1. Customer */}
        <section className="p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Customer</p>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-orange-50 text-sm font-extrabold uppercase text-orange-600">
              {customerName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900">{customerName}</p>
              <p className="truncate text-xs text-zinc-400">{customerEmail}</p>
            </div>
          </div>
          {o.address?.phone && (
            <p className="mt-2 text-xs text-zinc-500">{o.address.phone}</p>
          )}
          {o.address ? (
            <div className="mt-3 border border-zinc-100 bg-zinc-50 p-3 text-xs leading-6 text-zinc-700">
              <strong className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                Delivery Address
              </strong>
              {o.address.name}<br />
              {o.address.line1}{o.address.line2 ? `, ${o.address.line2}` : ""}<br />
              {o.address.city}, {o.address.state} – {o.address.zip}<br />
              {o.address.country}
            </div>
          ) : (
            <p className="mt-3 text-xs text-zinc-400 italic">No address provided</p>
          )}
        </section>

        {/* 2. Items */}
        <section className="p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Items ({o.items.length})
          </p>
          {/* Mobile: simple list. Desktop: table */}
          <div className="space-y-2 sm:hidden">
            {o.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 border border-zinc-100 p-2">
                {item.product.images[0]
                  ? <img src={item.product.images[0]} alt={item.product.name} className="h-10 w-10 shrink-0 object-cover" />
                  : <div className="h-10 w-10 shrink-0 bg-zinc-100" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-zinc-900">{item.product.name}</p>
                  <p className="text-xs text-zinc-400">
                    {item.quantity} × {fmtPrice(item.price)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-zinc-900">
                  {fmtPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto border border-zinc-100 sm:block">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <tr>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-center">Qty</th>
                  <th className="px-3 py-2 text-right">Unit</th>
                  <th className="px-3 py-2 text-right">Discount</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {o.items.map((item) => {
                  const unitDiscount = Math.min(item.discount ?? 0, item.price);
                  const unitPrice = item.price - unitDiscount;
                  return (
                    <tr key={item.id}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {item.product.images[0]
                            ? <img src={item.product.images[0]} alt={item.product.name} className="h-8 w-8 shrink-0 object-cover" />
                            : <div className="h-8 w-8 shrink-0 bg-zinc-100" />}
                          <span className="truncate font-medium text-zinc-900">{item.product.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center font-semibold text-zinc-700">{item.quantity}</td>
                      <td className="px-3 py-2.5 text-right text-zinc-500">
                        {unitDiscount > 0 ? (
                          <span>
                            {fmtPrice(unitPrice)}
                            <span className="ml-1 text-[10px] text-zinc-400 line-through">{fmtPrice(item.price)}</span>
                          </span>
                        ) : fmtPrice(item.price)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {unitDiscount > 0
                          ? <span className="text-xs font-semibold text-green-600">−{fmtPrice(unitDiscount)}</span>
                          : <span className="text-xs text-zinc-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-zinc-900">{fmtPrice(unitPrice * item.quantity)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Payment + Status */}
        <section className="divide-y divide-zinc-100">
          <div className="p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Payment</p>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-1">
              <Detail label="Status" value={o.payment?.status ?? "—"} />
              <Detail label="Amount" value={o.payment?.amount !== undefined ? fmtPrice(o.payment.amount) : "—"} strong />
            </dl>
            <div className="mt-4 pt-4 border-t border-zinc-100">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Change Payment</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={currentPaymentDraft}
                  onChange={(e) => onPaymentDraftChange(o.id, e.target.value as PaymentStatus)}
                  className="min-w-0 flex-1 border border-zinc-200 bg-white px-2 py-2 text-xs font-semibold text-zinc-700 focus:border-zinc-900 focus:outline-none"
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={updating === o.id || currentPaymentDraft === o.payment?.status}
                  onClick={() => onApplyPaymentStatus(o.id)}
                  className="shrink-0 bg-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {updating === o.id ? "…" : "Save"}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</p>
            <div className="space-y-2">
              <Timeline label="Placed" value={fmtDate(o.createdAt)} active />
              <Timeline label="Updated" value={fmtDate(o.updatedAt)} active={o.updatedAt !== o.createdAt} />
              <Timeline label="Current" value={o.status} active />
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-100">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Change Status</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={currentDraft}
                  onChange={(e) => onStatusDraftChange(o.id, e.target.value as OrderStatus)}
                  className="min-w-0 flex-1 border border-zinc-200 bg-white px-2 py-2 text-xs font-semibold text-zinc-700 focus:border-zinc-900 focus:outline-none"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={updating === o.id || currentDraft === o.status}
                  onClick={() => onApplyStatus(o.id)}
                  className="shrink-0 bg-orange-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {updating === o.id ? "…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Detail({
  label, value, mono = false, strong = false, compact = false,
}: {
  label: string; value: string; mono?: boolean; strong?: boolean; compact?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</dt>
      <dd className={[
        "mt-0.5 break-all text-zinc-700",
        mono ? "font-mono text-xs" : "text-sm",
        strong ? "font-bold text-zinc-900" : "",
        compact ? "truncate" : "",
      ].join(" ")}>{value}</dd>
    </div>
  );
}


function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className={["mt-0.5 whitespace-nowrap text-xs text-white", strong ? "font-extrabold" : "font-semibold"].join(" ")}>
        {value}
      </p>
    </div>
  );
}

function Timeline({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className={[
        "mt-1 h-2 w-2 shrink-0",
        active ? "bg-orange-500" : "bg-zinc-200",
      ].join(" ")} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
        <p className="mt-0.5 text-xs font-semibold text-zinc-800">{value}</p>
      </div>
    </div>
  );
}
