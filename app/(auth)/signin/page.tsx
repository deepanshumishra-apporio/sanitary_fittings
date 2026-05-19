"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api, { saveAccessToken } from "@/lib/api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { SITE_NAME } from "@/lib/theme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { AppDispatch } from "@/store";
import { fetchCurrentUser } from "@/store/slices/authSlice";

export default function SignInPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (user) router.replace("/profile");
  }, [user]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post<{ accessToken: string }>("/auth/login", { email, password });
      saveAccessToken(data.accessToken);
      const role = await hydrateSession(dispatch);
      router.replace(role === "ADMIN" || role === "SUBADMIN" ? "/admin/analytic" : "/profile");
    } catch (err: unknown) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">{SITE_NAME}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900">Welcome back</h1>
        <p className="mt-2 text-sm text-zinc-500">Sign in with your email and password.</p>
      </div>

      {error && (
        <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="border border-zinc-100 bg-white">
        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          <Input
            label="Email address"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
          />
          <div className="border-t border-zinc-100 pt-5">
            <Button type="submit" fullWidth loading={loading} disabled={!email || !password}>
              Sign In
            </Button>
          </div>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-500">
  By signing in, you agree to our{" "}
  <Link href="/terms" className="font-medium text-zinc-900 underline underline-offset-4">
    Terms of Service
  </Link>
</p>
    </div>
  );
}

async function hydrateSession(dispatch: AppDispatch): Promise<string | null> {
  const result = await dispatch(fetchCurrentUser());
  if (fetchCurrentUser.fulfilled.match(result)) {
    return result.payload?.role ?? null;
  }
  return null;
}

function extractError(err: unknown): string {
  return (
    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
    "Something went wrong. Please try again."
  );
}
