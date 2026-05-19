"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCurrentUser, logoutUser } from "@/store/slices/authSlice";

export function useAuth(requireAuth = false) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const loading = useAppSelector((s) => s.auth.loading);
  const initialized = useAppSelector((s) => s.auth.initialized);

  useEffect(() => {
    if (!initialized) {
      dispatch(fetchCurrentUser());
    }
  }, [initialized, dispatch]);

  useEffect(() => {
    if (initialized && !loading && !user && requireAuth) {
      router.replace("/signin");
    }
  }, [initialized, loading, user, requireAuth, router]);

  function logout() {
    dispatch(logoutUser()).finally(() => {
      router.replace("/signin");
      router.refresh();
    });
  }

  return { user, loading: !initialized || loading, logout };
}
