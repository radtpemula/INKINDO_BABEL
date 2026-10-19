// app/babel-and-adt/login/AdminLoginForm.tsx
// Interactive Client Component for Admin Login Form
// Uses React 19 `useActionState` and `useFormStatus` for smooth, accessible feedback.

"use client";

import React, { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { loginAdminAction, type LoginActionResult } from "@/lib/auth/actions";

function SubmitButton(): React.JSX.Element {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold text-slate-900 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer select-none"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
          <span>Memverifikasi...</span>
        </>
      ) : (
        <span>Masuk ke Dashboard</span>
      )}
    </button>
  );
}

export function AdminLoginForm(): React.JSX.Element {
  const [state, formAction] = useActionState<LoginActionResult | null, FormData>(
    loginAdminAction,
    null
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      {/* Generic Error Alert */}
      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <div className="flex-1 leading-relaxed">{state.error}</div>
        </div>
      )}

      {/* Identifier Field (Username or Email) */}
      <div>
        <label
          htmlFor="identifier"
          className="block text-xs font-medium text-slate-300 mb-1.5"
        >
          Username atau Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <User className="w-4 h-4" />
          </div>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            placeholder="Masukkan username atau email"
            className="block w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="block text-xs font-medium text-slate-300 mb-1.5"
        >
          Kata Sandi
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="block w-full pl-9 pr-10 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer focus:outline-hidden"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-1">
        <SubmitButton />
      </div>
    </form>
  );
}
