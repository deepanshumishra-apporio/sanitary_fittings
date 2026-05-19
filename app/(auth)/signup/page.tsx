"use client";

import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import api, { saveAccessToken } from "@/lib/api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { SITE_NAME } from "@/lib/theme";
import type { AppDispatch } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCurrentUser } from "@/store/slices/authSlice";

export default function SignUpPage() {

  redirect("/signin");


  // const router = useRouter();
  // const dispatch = useAppDispatch();
  // const [name, setName] = useState("");
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  // const [confirmPassword, setConfirmPassword] = useState("");
  // const [error, setError] = useState("");
  // const [loading, setLoading] = useState(false);

  // const user = useAppSelector((state) => state.auth.user);

  //   useEffect(() => {
  //     if (user) router.replace("/profile");
  //   }, [user]);

  // async function handleSubmit(e: React.SyntheticEvent) {
  //   e.preventDefault();
  //   if (password !== confirmPassword) {
  //     setError("Passwords do not match.");
  //     return;
  //   }
  //   setError("");
  //   setLoading(true);
  //   try {
  //     const { data } = await api.post<{ accessToken: string }>("/auth/signup", {
  //       email,
  //       password,
  //       name: name.trim() || undefined,
  //     });
  //     saveAccessToken(data.accessToken);
  //     const role = await hydrateSession(dispatch);
  //     router.replace(role === "ADMIN" || role === "SUBADMIN" ? "/admin/analytic" : "/profile");
  //   } catch (err: unknown) {
  //     setError(extractError(err));
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  // return (
  //   <div className="w-full max-w-md">
  //     <div className="mb-8">
  //       <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">{SITE_NAME}</p>
  //       <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900">Create account</h1>
  //       <p className="mt-2 text-sm text-zinc-500">
  //         Start with a simple email and password.
  //       </p>
  //     </div>

  //     {error && (
  //       <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
  //         {error}
  //       </div>
  //     )}

  //     <div className="border border-zinc-100 bg-white">
  //       <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
  //         <Input
  //           label="Full name (optional)"
  //           type="text"
  //           autoFocus
  //           value={name}
  //           onChange={(e) => setName(e.target.value)}
  //           placeholder="Jane Doe"
  //         />
  //         <Input
  //           label="Email address"
  //           type="email"
  //           required
  //           value={email}
  //           onChange={(e) => setEmail(e.target.value)}
  //           placeholder="you@example.com"
  //         />
  //         <Input
  //           label="Password"
  //           type="password"
  //           required
  //           value={password}
  //           onChange={(e) => setPassword(e.target.value)}
  //           placeholder="At least 8 characters"
  //         />
  //         <Input
  //           label="Confirm password"
  //           type="password"
  //           required
  //           value={confirmPassword}
  //           onChange={(e) => setConfirmPassword(e.target.value)}
  //           placeholder="Repeat password"
  //         />
  //         <div className="border-t border-zinc-100 pt-5">
  //           <Button type="submit" fullWidth loading={loading} disabled={!email || !password || !confirmPassword}>
  //             Create Account
  //           </Button>
  //         </div>
  //       </form>
  //     </div>

  //     <p className="mt-6 text-center text-sm text-zinc-500">
  //       Already have an account?{" "}
  //       <Link href="/signin" className="font-medium text-zinc-900 underline underline-offset-4">
  //         Sign in
  //       </Link>
  //     </p>
  //   </div>
  // );
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
