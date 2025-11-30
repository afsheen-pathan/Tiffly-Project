// src/pages/PaymentSuccessPage.tsx
import React from 'react';

export const PaymentSuccessPage = () => {
  // --- CONFIGURATION ---
  // 1. For "Real" App (Standalone/APK):
  const appDeepLink = "tiffly://"; 
  
  // 2. For Expo Go Development (MOST RELIABLE FOR TESTING):
  // REPLACE THIS IP with your computer's current Wi-Fi IP (same as api.ts)
  const expoGoLink = "exp://10.166.114.103:8081"; 
  // ---------------------

  return (
    <div className="flex h-screen min-h-full items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 text-center shadow-xl">
        <div>
          {/* Checkmark Icon */}
          <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Payment Successful!
          </h2>
          
          <p className="mt-3 text-lg text-gray-600">
            Your subscription is now active. Thank you!
          </p>
          
          <div className="mt-8 space-y-4">
            {/* Primary Button: Return to App */}
            <a
              href={expoGoLink} // Using Expo link for development reliability
              className="inline-block w-full rounded-md bg-green-600 px-4 py-3 text-base font-medium text-white shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Return to App
            </a>

            <p className="text-xs text-gray-400">
              (Dev Note: If the button above doesn't work, try <a href={appDeepLink} className="underline">this link</a>)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};