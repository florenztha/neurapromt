'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { TARGET_CHAIN_ID, TARGET_CHAIN_HEX } from '@/lib/web3';

interface WalletContextType {
  account: string | null;
  chainId: number | null;
  balance: string | null; // in ANKR
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return ctx;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  // helper to refresh state from provider
  const syncState = async (ethereum: any) => {
    try {
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      const acct = accounts[0] || null;
      setAccount(acct);
      const currentChain = await ethereum.request({ method: 'eth_chainId' });
      setChainId(parseInt(currentChain, 16));
      if (acct) {
        const provider = new ethers.BrowserProvider(ethereum as any);
        const rawBal = await provider.getBalance(acct);
        setBalance(ethers.formatEther(rawBal));
      } else {
        setBalance(null);
      }
    } catch (err) {
      console.error('syncState error', err);
    }
  };

  const connect = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('No Web3 wallet found. Please install MetaMask or OKX Wallet.');
      return;
    }
    const ethereum = (window as any).ethereum;
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const chain = await ethereum.request({ method: 'eth_chainId' });
      const acct = accounts[0] || null;
      setAccount(acct);
      setChainId(parseInt(chain, 16));

      if (acct) {
        const provider = new ethers.BrowserProvider(ethereum as any);
        const rawBal = await provider.getBalance(acct);
        setBalance(ethers.formatEther(rawBal));
      }

      // if wrong network, ask to switch/add
      if (parseInt(chain, 16) !== TARGET_CHAIN_ID) {
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: TARGET_CHAIN_HEX }],
          });
          setChainId(TARGET_CHAIN_ID);
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: TARGET_CHAIN_HEX,
                  chainName: 'Neura Testnet',
                  nativeCurrency: { name: 'ANKR', symbol: 'ANKR', decimals: 18 },
                  rpcUrls: ['https://testnet.rpc.neuraprotocol.io/'],
                  blockExplorerUrls: ['https://testnet-blockscout.infra.neuraprotocol.io/'],
                },
              ],
            });
            setChainId(TARGET_CHAIN_ID);
          }
        }
      }
    } catch (err) {
      console.error('connect wallet error', err);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setChainId(null);
    setBalance(null);
  };

  const refreshBalance = async () => {
    if (account && typeof window !== 'undefined' && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum as any);
      const rawBal = await provider.getBalance(account);
      setBalance(ethers.formatEther(rawBal));
    }
  };

  // initial sync and event hookup; run only once to avoid re-sync on internal state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      syncState(ethereum);

      const handleAccountsChanged = (accounts: string[]) => {
        const acct = accounts[0] || null;
        setAccount(acct);
        if (acct) refreshBalance();
      };
      const handleChainChanged = (chainHex: string) => {
        setChainId(parseInt(chainHex, 16));
        refreshBalance();
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return (
    <WalletContext.Provider value={{ account, chainId, balance, connect, disconnect, refreshBalance }}>
      {children}
    </WalletContext.Provider>
  );
};
