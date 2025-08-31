import React from 'react';
import Link from 'next/link';

export default function Custom500() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">500</h1>
          <p className="text-gray-600 mb-4">
            Oops! Something went wrong on our end.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            We're working to fix the problem. Please try again later.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
