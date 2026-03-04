'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { cn } from '@/lib/utils';

export default function WalletButton() {
  const { account, chainId, balance, connect, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  const shortAddress = (addr: string) => {
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  };

  const networkLabel = () => {
    if (chainId === null) return 'Not connected';
    if (chainId === 267) return 'Neura Testnet';
    return `Chain ${chainId}`;
  };

  const toggleMenu = () => setMenuOpen(o => !o);

  // close menu when clicking outside
  React.useEffect(() => {
    if (!menuOpen) return;
    const handleDocument = (e: MouseEvent) => {
      const el = document.getElementById('wallet-button-root');
      if (el && !el.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocument);
    return () => document.removeEventListener('mousedown', handleDocument);
  }, [menuOpen]);

  if (account) {
    return (
      <div id="wallet-button-root" className="relative inline-block text-left">
        <button
          onClick={toggleMenu}
          className={cn(
            'px-4 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-2',
            'bg-gradient-to-r from-yellow-300 via-pink-400 to-yellow-300 text-white hover:opacity-90'
          )}
        >
          {shortAddress(account)}
          <span className="text-xs opacity-80">({networkLabel()})</span>
          <svg
            className="w-4 h-4 ml-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {menuOpen && (
          <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              <p className="px-4 py-2 text-sm text-zinc-700">
                Balance: {balance ? Number(balance).toFixed(4) : '...'} ANKR
              </p>
              <button
                onClick={() => {
                  disconnect();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-zinc-100"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className={cn(
        'px-4 py-2 rounded-full font-semibold text-sm transition-colors',
        'bg-gradient-to-r from-yellow-300 via-pink-400 to-yellow-300 text-white hover:opacity-90'
      )}
    >
      Connect Wallet
    </button>
  );
}
