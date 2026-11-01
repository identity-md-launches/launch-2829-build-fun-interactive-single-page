import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors/injected';
import { coinbaseWallet } from 'wagmi/connectors/coinbaseWallet';
import { createPublicClient, fallback } from 'viem';
import { sepolia } from 'viem/chains';

export const SITE_NAME = 'Squeek Garden';
export const API_URL = 'https://api.squeekchain.com';
// The deployment served by the official Sepolia app/API, verified 2026-11-01.
export const CORE_ADDRESS = '0x980b4424c007caf7a1f3670b48c8eaef7ebc3d44' as const;
export const STREAM_ID = '0x52e443e4e0d236ff0c07f4cdc518c594a3d680d20abb1481510efbed0ec73633';
export const PUBLIC_RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';
export const LIVESTREAM_URL = 'https://sepolia.squeekchain.com/';
export const EXPLORER_URL = 'https://sepolia.etherscan.io';

export const config = createConfig({
  chains: [sepolia],
  multiInjectedProviderDiscovery: true,
  connectors: [injected(), coinbaseWallet({ appName: SITE_NAME, ...(typeof location !== 'undefined' ? { appLogoUrl: new URL(`${import.meta.env.BASE_URL}favicon.svg`, location.href).href } : {}) })],
  transports: { [sepolia.id]: http(PUBLIC_RPC_URL) },
});

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: fallback([http(PUBLIC_RPC_URL, { timeout: 12_000, retryCount: 1 }), http('https://sepolia.drpc.org', { timeout: 12_000, retryCount: 1 })]),
});

export const ROUND_RECORDED_ABI = [{
  type: 'event', name: 'RoundRecorded', anonymous: false,
  inputs: [
    { name: 'roundId', type: 'uint64', indexed: true },
    { name: 'work', type: 'uint64', indexed: false },
    { name: 'cumulativeWork', type: 'uint64', indexed: false },
    { name: 'cumulativeBlockUnits', type: 'uint96', indexed: false },
    { name: 'workPerThousandBlocks', type: 'uint32', indexed: false },
    { name: 'dataHash', type: 'bytes32', indexed: false },
  ],
}] as const;
