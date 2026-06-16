import { calibration, mainnet, Synapse, type UploadResult } from "@filoz/synapse-sdk";
import { custom, type EIP1193Provider } from "viem";

export type NetworkChoice = "calibration" | "mainnet";

export interface SynapseSession {
  address: string;
  synapse: ReturnType<typeof Synapse.create>;
}

export interface SerializedCopy {
  providerId: string;
  dataSetId: string;
  pieceId: string;
  role: string;
  retrievalUrl: string;
  isNewDataSet: boolean;
}

export interface SerializedUpload {
  pieceCid: string;
  size: number;
  complete: boolean;
  requestedCopies: number;
  copies: SerializedCopy[];
  failedAttempts: Array<{
    providerId: string;
    role: string;
    error: string;
    explicit: boolean;
  }>;
}

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export const networkLabels: Record<NetworkChoice, string> = {
  calibration: "Filecoin Calibration",
  mainnet: "Filecoin Mainnet",
};

export const networkChainIds: Record<NetworkChoice, string> = {
  calibration: "0x4cb2f",
  mainnet: "0x13a",
};

export async function requestNetwork(network: NetworkChoice) {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: networkChainIds[network] }],
    });
  } catch {
    // Wallets that do not know Filecoin chains can still continue and show their own prompt.
  }
}

export async function createSynapseSession(network: NetworkChoice): Promise<SynapseSession> {
  if (!window.ethereum) {
    throw new Error("No browser wallet found. Install MetaMask or another EIP-1193 wallet.");
  }

  await requestNetwork(network);
  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];

  const address = accounts[0];
  if (!address) {
    throw new Error("Wallet connection did not return an address.");
  }

  const synapse = Synapse.create({
    account: address as `0x${string}`,
    transport: custom(window.ethereum),
    chain: network === "mainnet" ? mainnet : calibration,
    source: "fil-cnes",
  });

  return { address, synapse };
}

export function serializeUpload(result: UploadResult): SerializedUpload {
  return {
    pieceCid: result.pieceCid.toString(),
    size: result.size,
    complete: result.complete,
    requestedCopies: result.requestedCopies,
    copies: result.copies.map((copy) => ({
      providerId: copy.providerId.toString(),
      dataSetId: copy.dataSetId.toString(),
      pieceId: copy.pieceId.toString(),
      role: copy.role,
      retrievalUrl: copy.retrievalUrl,
      isNewDataSet: copy.isNewDataSet,
    })),
    failedAttempts: result.failedAttempts.map((attempt) => ({
      providerId: attempt.providerId.toString(),
      role: attempt.role,
      error: attempt.error,
      explicit: attempt.explicit,
    })),
  };
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function shortCid(cid: string) {
  if (cid.length <= 22) return cid;
  return `${cid.slice(0, 14)}...${cid.slice(-8)}`;
}

