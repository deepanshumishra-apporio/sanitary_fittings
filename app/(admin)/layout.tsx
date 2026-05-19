"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function ChartIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

function ProductIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function CustomerIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L9.568 3zM6 6h.008v.008H6V6z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function VendorIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const BASE_NAV: NavItem[] = [
  { label: "Analytics", href: "/admin/analytic", icon: <ChartIcon /> },
  { label: "Orders", href: "/admin/order", icon: <OrderIcon /> },
  { label: "Products", href: "/admin/product", icon: <ProductIcon /> },
  { label: "Categories", href: "/admin/category", icon: <CategoryIcon /> },
  { label: "Vendors", href: "/admin/vendor", icon: <VendorIcon /> },
  { label: "Customers", href: "/admin/customer", icon: <CustomerIcon /> },
  { label: "Profile", href: "/admin/profile", icon: <ProfileIcon /> },
];

const SUBADMIN_ITEM: NavItem = {
  label: "Subadmins",
  href: "/admin/subadmin",
  icon: <ShieldIcon />,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth(true);
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api.get<{ meta: { total: number } }>("/order?status=PENDING&limit=1")
      .then(({ data }) => setPendingCount(data.meta?.total ?? 0))
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!loading && user && user.role !== "ADMIN" && user.role !== "SUBADMIN") {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "SUBADMIN")) return null;

  const authedUser = user;
  const nav = [...BASE_NAV, ...(authedUser.role === "ADMIN" ? [SUBADMIN_ITEM] : [])];
  const initials = (authedUser.name ?? authedUser.email ?? "A").charAt(0).toUpperCase();

  function SidebarContent() {
    return (
      <>
        <div className="border-b border-zinc-100 px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-400">
                  Admin Panel
                </p>
              </div>
              <p className="mt-3 text-lg font-extrabold tracking-tight text-zinc-900">Sanitary Fitted</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Manage products, orders, customers, and team access.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mt-0.5 text-zinc-400 transition-colors hover:text-zinc-900 lg:hidden"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
            Navigation
          </p>
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "mb-1 flex items-center gap-3 border px-3 py-3 text-[13px] font-semibold tracking-wide transition-colors",
                  active
                    ? "border-orange-200 bg-orange-50 text-orange-600"
                    : "border-transparent text-zinc-500 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-800",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-9 w-9 items-center justify-center border transition-colors",
                    active
                      ? "border-orange-200 bg-orange-100 text-orange-500"
                      : "border-zinc-200 bg-zinc-50 text-zinc-400",
                  ].join(" ")}
                >
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.href === "/admin/order" && pendingCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-100 p-4">
          <div className="border border-zinc-200 bg-zinc-50 p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-orange-100 text-sm font-extrabold text-orange-600">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {authedUser.name ?? authedUser.email ?? "-"}
                </p>
                <span className="mt-1 inline-block bg-orange-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-orange-600">
                  {authedUser.role}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 w-full border border-zinc-200 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:border-red-200 hover:text-red-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-zinc-50">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-white px-4 py-3 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="border border-zinc-200 bg-zinc-50 p-2 text-zinc-500 transition-colors hover:border-zinc-900 hover:bg-white hover:text-zinc-900"
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-400">
            Admin Panel
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center bg-orange-100 text-xs font-extrabold text-orange-600">
          {initials}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}

        <aside
          className={[
            "fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-zinc-100 bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
            open ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <SidebarContent />
        </aside>

        <aside className="hidden w-72 shrink-0 flex-col border-r border-zinc-100 bg-white xl:flex">
          <SidebarContent />
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-zinc-50">
          {children}
        </main>
      </div>
    </div>
  );
}
