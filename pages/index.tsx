import React from 'react';
import { Web3StatusImproved } from '@/components/Web3StatusImproved';
import { Toaster } from 'react-hot-toast';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Web3 Wallet Connection Demo
          </h1>
          <p className="text-lg text-gray-600">
            Enhanced blockchain wallet connection with SOLID principles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Wallet Connection */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Wallet Connection
            </h2>
            <Web3StatusImproved 
              showHealthMonitor={true}
              showAdvanced={false}
            />
          </div>

          {/* Advanced View */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Advanced Monitoring
            </h2>
            <Web3StatusImproved 
              showHealthMonitor={true}
              showAdvanced={true}
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            SOLID Principles Implementation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">SRP</h3>
              <p className="text-sm text-blue-700">
                Single Responsibility: Each component has one clear purpose
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">OCP</h3>
              <p className="text-sm text-green-700">
                Open/Closed: Easy to add new wallets and networks
              </p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">LSP</h3>
              <p className="text-sm text-yellow-700">
                Liskov Substitution: Services can be swapped seamlessly
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">ISP</h3>
              <p className="text-sm text-purple-700">
                Interface Segregation: Focused hooks and components
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2">DIP</h3>
              <p className="text-sm text-red-700">
                Dependency Inversion: Services injected via context
              </p>
            </div>
          </div>
        </div>

        {/* Architecture Benefits */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Architecture Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Improved Testability</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Services can be easily mocked</li>
                <li>• Components can be tested in isolation</li>
                <li>• Dependencies are explicit and injectable</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Better Maintainability</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Single responsibility for each component</li>
                <li>• Clear separation of concerns</li>
                <li>• Easier to modify individual parts</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Enhanced Extensibility</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• New wallet types can be added without code changes</li>
                <li>• New networks can be added through configuration</li>
                <li>• New features can be added without affecting existing code</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Reduced Coupling</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Components don't depend on specific implementations</li>
                <li>• Services can be swapped without affecting components</li>
                <li>• External library changes are isolated</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}
