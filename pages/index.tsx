import React from 'react';
import Head from 'next/head';
import { WalletExample } from '@/components/examples/WalletExample';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Home() {
  return (
    <>
      <Head>
        <title>Blockchain Wallet Connection Demo</title>
        <meta name="description" content="Enhanced blockchain wallet connection with error handling, loading states, network validation, and persistence" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ErrorBoundary>
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <WalletExample />
        </main>
      </ErrorBoundary>
    </>
  );
}
