// src/pages/AdminLogin.tsx

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../hooks/useAuth";
import type { SignInData } from "../services/adminAuthService";

// Validation Schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const AdminLogin = () => {
  const { signIn, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: SignInData) => {
    setError(null);
    const result = await signIn(data);

    if (result.error) {
      setError(
        result.error === "Not authorized as admin."
          ? "You do not have admin privileges."
          : "Invalid email or password."
      );
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-white px-4">

      <div className="w-full max-w-md rounded-xl bg-white p-10 shadow-lg border border-gray-200">

        {/* Title */}
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">
          Tiffly Admin
        </h1>

        <p className="text-center text-sm text-gray-500 mb-6">
          Login to continue
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>

          {/* EMAIL */}
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-800">
              Email
            </label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="email"
                  className={`w-full rounded-lg border px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 transition ${
                    errors.email
                      ? "border-red-400 focus:ring-red-300"
                      : "border-gray-300 focus:ring-purple-300"
                  }`}
                  placeholder="admin@example.com"
                />
              )}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* PASSWORD */}
          <div className="mb-5">
            <label className="block mb-1 text-sm font-medium text-gray-800">
              Password
            </label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="password"
                  className={`w-full rounded-lg border px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 transition ${
                    errors.password
                      ? "border-red-400 focus:ring-red-300"
                      : "border-gray-300 focus:ring-purple-300"
                  }`}
                  placeholder="••••••••"
                />
              )}
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* GENERAL ERROR */}
          {error && (
            <p className="mb-4 text-center text-sm text-red-500 bg-red-50 py-2 rounded-lg border border-red-200">
              {error}
            </p>
          )}

          {/* LOGIN BUTTON — NEW THEME COLOR */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#8884d8] py-3 font-semibold text-white shadow-md hover:bg-[#726cc7] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Tiffly Admin Panel
        </p>
      </div>
    </div>
  );
};
