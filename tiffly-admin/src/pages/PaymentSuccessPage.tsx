// src/pages/PaymentSuccessPage.tsx

import React from "react";

export const PaymentSuccessPage = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-md border border-gray-200">
        
        {/* Success Icon */}
        <svg
          className="mx-auto h-20 w-20 text-green-500 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900">
          Payment Successful 🎉
        </h1>

        {/* Subtitle */}
        <p className="mt-3 text-lg text-gray-600">
          Your subscription has been activated.
        </p>

        {/* Friendly Note */}
        <p className="mt-6 text-sm text-gray-500">
          You may now return to the <span className="font-semibold">Tiffly App</span> to continue enjoying your meal service.
        </p>

        {/* Footer Notice */}
        <p className="mt-2 text-xs text-gray-400">
          This page can be safely closed.
        </p>
      </div>
    </div>
  );
};
