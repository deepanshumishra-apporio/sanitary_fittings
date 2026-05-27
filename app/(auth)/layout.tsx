"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCurrentUser, logoutUser } from "@/store/slices/authSlice";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const initialized = useAppSelector((s) => s.auth.initialized);

  // Bootstrap auth state if not yet done
  useEffect(() => {
    if (!initialized) {
      dispatch(fetchCurrentUser());
    }
  }, [initialized, dispatch]);

  useEffect(() => {
    if (!initialized || !user) return;
    if (user.role === "ADMIN" || user.role === "SUBADMIN") {
      router.replace("/admin/analytic");
      return;
    }
    dispatch(logoutUser());
  }, [dispatch, initialized, user, router]);

  // Show spinner while we don't yet know the auth state
  if (!initialized) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  // Already logged in — render nothing while redirect fires
  if (user) return null;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-5xl border border-zinc-100 bg-white shadow-sm">
        <div className="grid min-h-[640px] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden border-r border-zinc-100 bg-zinc-900 px-8 py-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-orange-300">
                Sanitary Fitted
              </p>
              <h1 className="mt-6 max-w-sm text-4xl font-extrabold tracking-tight">
                Admin access for daily operations.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-zinc-300">
                Sign in to manage orders, products, customers, and team access from one place.
              </p>
            </div>
            <div className="grid gap-px bg-zinc-800 sm:grid-cols-3">
              {[
                { label: "Orders", value: "Track" },
                { label: "Products", value: "Manage" },
                { label: "Customers", value: "Manage" },
              ].map((item) => (
                <div key={item.label} className="bg-zinc-900 px-4 py-4">
                  <p className="text-lg font-extrabold text-white">{item.value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center px-5 py-8 sm:px-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
