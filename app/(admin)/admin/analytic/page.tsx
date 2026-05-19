"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { fmtPrice, fmtDate } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { OrderStatusBadge } from "@/components/ui/Badge";

interface DailyPoint { date: string; revenue: number; orders: number; }

interface Analytics {
  totalOrders: number;
  totalRevenue: number;
  grossRevenue: number;
  deliveredRevenue: number;
  activeOrderValue: number;
  cancelledOrderValue: number;
  averageOrderValue: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  totalProducts: number;
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  recentOrders: {
    id: string; totalPrice: number; status: OrderStatus; createdAt: string;
    user: { name: string | null; email: string | null };
  }[];
  dailyData: DailyPoint[];
}

type Range = "today" | "7d" | "30d" | "all";

function rangeToParams(r: Range): { from?: string; to?: string } {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  if (r === "today") {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    return { from: iso(start), to: iso(now) };
  }
  if (r === "7d") return { from: iso(new Date(Date.now() - 6 * 86400000)), to: iso(now) };
  if (r === "30d") return { from: iso(new Date(Date.now() - 29 * 86400000)), to: iso(now) };
  return {};
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────

function BarChart({ data }: { data: DailyPoint[] }) {
  if (data.length === 0) return (
    <div className="flex h-32 items-center justify-center text-sm text-zinc-400">
      No revenue data for this period
    </div>
  );

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const barWidth = Math.max(4, Math.min(32, Math.floor(560 / data.length) - 3));

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-0 items-end gap-1 px-1" style={{ height: 120 }}>
        {data.map((d) => {
          const h = Math.max(4, Math.round((d.revenue / maxRevenue) * 108));
          const label = d.date.slice(5); // MM-DD
          return (
            <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end" style={{ minWidth: barWidth }}>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1.5 hidden whitespace-nowrap border border-zinc-200 bg-white px-2 py-1 text-xs shadow-md group-hover:block z-10">
                <p className="font-semibold text-zinc-900">{fmtPrice(d.revenue)}</p>
                <p className="text-zinc-400">{d.orders} order{d.orders !== 1 ? "s" : ""} · {d.date}</p>
              </div>
              <div
                className="w-full bg-orange-500 transition-all group-hover:bg-orange-600"
                style={{ height: h }}
              />
              {data.length <= 14 && (
                <p className="mt-1 text-[8px] text-zinc-400 rotate-0">{label}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function OrdersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  );
}
function RevenueIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}
function CustomersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
function ProductsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

const STATUS_ORDER: OrderStatus[] = [
  "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED",
];

const RANGE_LABELS: Record<Range, string> = { today: "Today", "7d": "7 Days", "30d": "30 Days", all: "All Time" };

export default function AnalyticPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<Range>("30d");

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    const { from, to } = rangeToParams(range);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    api
      .get<{ data: Analytics }>(`/auth/analytics?${params}`)
      .then(({ data: res }) => setData(res.data))
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [range]);

  if (error) {
    return (
      <div className="p-8">
        <p className="border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  const grossRevenue = data.grossRevenue ?? data.totalRevenue;
  const deliveredRevenue = data.deliveredRevenue ?? 0;
  const activeOrderValue = data.activeOrderValue ?? 0;
  const cancelledOrderValue = data.cancelledOrderValue ?? 0;
  const averageOrderValue = data.averageOrderValue ?? (data.totalOrders ? grossRevenue / data.totalOrders : 0);
  const activeOrders = data.activeOrders ?? 0;
  const completedOrders = data.completedOrders ?? (data.ordersByStatus.DELIVERED ?? 0);
  const cancelledOrders = data.cancelledOrders ?? ((data.ordersByStatus.CANCELLED ?? 0) + (data.ordersByStatus.REFUNDED ?? 0));

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">Overview</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-900">Analytics</h1>
          <p className="mt-1 text-sm text-zinc-400">Store performance, order movement, and recent activity.</p>
        </div>

        {/* Date range pills */}
        <div className="flex items-center gap-1.5">
          {(["today", "7d", "30d", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={[
                "px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors",
                range === r
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-900 hover:text-zinc-900",
              ].join(" ")}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="border border-zinc-100 bg-white shadow-sm">
          <div className="grid gap-px bg-zinc-100 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="bg-white p-6">
              <div className="inline-flex h-11 w-11 items-center justify-center bg-orange-50 text-orange-600">
                <RevenueIcon />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.28em] text-zinc-400">Billable Revenue</p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight text-zinc-950">{fmtPrice(grossRevenue)}</p>
              <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">
                Calculated from active and delivered orders. Cancelled and refunded values are kept separate.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <RevenueChip label="Delivered" value={fmtPrice(deliveredRevenue)} tone="emerald" />
                <RevenueChip label="Active" value={fmtPrice(activeOrderValue)} tone="orange" />
                <RevenueChip label="Cancelled" value={fmtPrice(cancelledOrderValue)} tone="zinc" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-zinc-100">
              <MetricBlock label="Orders" value={data.totalOrders} icon={<OrdersIcon />} tone="orange" />
              <MetricBlock label="Customers" value={data.totalCustomers} icon={<CustomersIcon />} tone="sky" />
              <MetricBlock label="Products" value={data.totalProducts} icon={<ProductsIcon />} tone="violet" />
              <MetricBlock label="Avg Order" value={fmtPrice(averageOrderValue)} icon={<RevenueIcon />} tone="emerald" />
            </div>
          </div>
        </section>

        <section className="border border-zinc-100 bg-white shadow-sm">
          <PanelHeader title="Order Flow" subtitle={`${activeOrders} active, ${completedOrders} delivered`} />
          <div className="grid grid-cols-3 gap-px bg-zinc-100 border-b border-zinc-100">
            <MiniStat label="Active" value={activeOrders} />
            <MiniStat label="Delivered" value={completedOrders} />
            <MiniStat label="Closed" value={cancelledOrders} />
          </div>
          <div className="space-y-3 p-5">
            {STATUS_ORDER.every((s) => !data.ordersByStatus[s]) ? (
              <p className="py-8 text-center text-sm text-zinc-400">No orders yet</p>
            ) : (
              STATUS_ORDER.map((status) => {
                const count = data.ordersByStatus[status] ?? 0;
                const width = data.totalOrders ? Math.max(4, (count / data.totalOrders) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <OrderStatusBadge status={status} />
                      <span className="text-sm font-bold text-zinc-900">{count}</span>
                    </div>
                    <div className="h-2 bg-zinc-100">
                      <div className="h-full bg-orange-500" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Revenue chart */}
        <section className="border border-zinc-100 bg-white shadow-sm xl:col-span-2">
          <PanelHeader
            title="Revenue Chart"
            subtitle={`Billable revenue · ${RANGE_LABELS[range]}`}
          />
          <div className="p-5">
            <BarChart data={data.dailyData ?? []} />
          </div>
        </section>

        <section className="border border-zinc-100 bg-white shadow-sm xl:col-span-2">
          <PanelHeader title="Recent Orders" subtitle="Latest customer activity" />
          {data.recentOrders.length === 0 ? (
            <p className="px-6 py-10 text-sm text-zinc-400">No orders in this period</p>
          ) : (
            <div className="grid divide-y divide-zinc-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              {[0, 1].map((col) => (
                <div key={col} className="divide-y divide-zinc-100">
                  {data.recentOrders.filter((_, i) => i % 2 === col).map((order) => {
                    const name = order.user.name ?? order.user.email ?? "—";
                    return (
                      <div key={order.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-orange-50 text-xs font-extrabold text-orange-600">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-zinc-900">{name}</p>
                            <span className="font-mono text-[10px] text-zinc-300">#{order.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <OrderStatusBadge status={order.status} />
                            <span className="text-xs text-zinc-400">{fmtDate(order.createdAt)}</span>
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-zinc-900">{fmtPrice(order.totalPrice)}</span>
                      </div>
                    );
                  })}
                  {data.recentOrders.filter((_, i) => i % 2 === col).length === 0 && <div className="hidden lg:block" />}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricBlock({ label, value, icon, tone }: {
  label: string; value: string | number; icon: React.ReactNode;
  tone: "orange" | "emerald" | "sky" | "violet";
}) {
  const tones = { orange: "bg-orange-50 text-orange-600", emerald: "bg-emerald-50 text-emerald-600", sky: "bg-sky-50 text-sky-600", violet: "bg-violet-50 text-violet-600" };
  return (
    <div className="bg-white p-5">
      <div className={`mb-4 inline-flex h-9 w-9 items-center justify-center ${tones[tone]}`}>{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-950">{value}</p>
    </div>
  );
}

function RevenueChip({ label, value, tone }: { label: string; value: string; tone: "orange" | "emerald" | "zinc" }) {
  const tones = { orange: "border-orange-100 bg-orange-50 text-orange-700", emerald: "border-emerald-100 bg-emerald-50 text-emerald-700", zinc: "border-zinc-100 bg-zinc-50 text-zinc-700" };
  return (
    <div className={`border px-3 py-2 ${tones[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 text-sm font-extrabold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white px-4 py-3 text-center">
      <p className="text-lg font-extrabold text-zinc-950">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
    </div>
  );
}

function PanelHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 px-5 py-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-900">{title}</p>
        <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>
      </div>
    </div>
  );
}
