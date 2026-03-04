import { ethers } from 'ethers';

// Configuration for the Neura Testnet
export const TARGET_CHAIN_ID = 267;
export const TARGET_CHAIN_HEX = '0x10B'; // 267 in hex
export const DEV_WALLET_ADDRESS = '0xBdA7Ffae978bb2bC53ABc8d803D61DB768942e42';
export const PAYMENT_AMOUNT = '0.05'; // in ANKR (same decimals as ETH)

// Prompt generator trigger: charge a small amount of ANKR to the developer wallet.
// This will prompt the user to confirm the transaction via their injected wallet (MetaMask / OKX).
// If the user rejects or the network is incorrect the function will throw and the caller should
// abort whatever generation they were doing.
export async function chargeForPrompt() {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    // if there's no wallet available we can't charge the user, generation must halt
    throw new Error('Web3 wallet not detected - please install MetaMask or OKX Wallet and connect.');
  }

  const ethereum = (window as any).ethereum;

  const provider = new ethers.BrowserProvider(ethereum as any);
  const network = await provider.getNetwork();

  // ensure correct network
  if (Number(network.chainId) !== TARGET_CHAIN_ID) {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: TARGET_CHAIN_HEX }],
      });
    } catch (switchError: any) {
      // chain not added to wallet
      if (switchError.code === 4902) {
        // add the chain then try switching again
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: TARGET_CHAIN_HEX,
              chainName: 'Neura Testnet',
              nativeCurrency: {
                name: 'ANKR',
                symbol: 'ANKR',
                decimals: 18,
              },
              rpcUrls: ['https://testnet.rpc.neuraprotocol.io/'],
              blockExplorerUrls: ['https://testnet-blockscout.infra.neuraprotocol.io/'],
            },
          ],
        });
        // after adding, wallet_switch will either have succeeded or throw again,
        // we don't need to call it a second time because adding usually also switches.
      } else {
        throw switchError;
      }
    }
  }

  const signer = await provider.getSigner();
  const tx = await signer.sendTransaction({
    to: DEV_WALLET_ADDRESS,
    value: ethers.parseEther(PAYMENT_AMOUNT),
  });

  // wait for confirmation (optional but keeps UX deterministic)
  await tx.wait();
}
