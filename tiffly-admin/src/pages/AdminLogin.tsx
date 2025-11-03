// src/pages/AdminLogin.tsx
import { useState } from 'react'; // Keep useState for local error
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';import type { SignInData } from '../services/adminAuthService';
// Validation schema remains the same
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const AdminLogin = () => {
  // Get signIn and loading state from the context
  const { signIn, loading } = useAuth();
  // Keep local error state for UI feedback
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<SignInData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Updated submit handler
  const onSubmit = async (data: SignInData) => {
    setError(null); // Clear previous errors
    const result = await signIn(data); // Call signIn from context
    if (result.error) {
      // Display specific error messages
      if (result.error === 'Not authorized as admin.') {
        setError('Error: You do not have admin privileges.');
      } else {
        setError('Error: Invalid email or password.');
      }
    }
    // No setLoading needed, context handles it.
    // Navigation will happen automatically via App.tsx if successful.
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Tiffly Admin Login
        </h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Email Input */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="email">
              Email
            </label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  id="email"
                  type="email"
                  className={`w-full rounded-md border px-3 py-2 text-gray-700 focus:outline-none focus:ring-1 ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  autoComplete="email"
                />
              )}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  id="password"
                  type="password"
                  className={`w-full rounded-md border px-3 py-2 text-gray-700 focus:outline-none focus:ring-1 ${
                    errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  autoComplete="current-password"
                />
              )}
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {/* Display general error */}
          {error && <p className="mb-4 text-center text-sm text-red-500">{error}</p>}

          {/* Submit Button - uses loading from context */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};