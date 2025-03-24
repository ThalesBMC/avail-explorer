import { Transaction, TransactionStatus } from "@/types/actions";

export interface TransactionStore {
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  updateTransactionStatus: (
    id: string,
    status: TransactionStatus,
    message: string
  ) => void;
}

export interface TransactionResult {
  success: boolean;
  blockHash?: string;
  explorerUrl?: string;
  error?: string;
  status?: "inBlock" | "finalized" | "pending";
  hash?: string;
  txHash?: string;
  extrinsicId?: string;
}

// Types for transaction events
export type TransactionEventType =
  | { type: "BROADCAST"; txHash: string }
  | { type: "PENDING"; txHash: string }
  | { type: "IN_BLOCK"; blockHash: string; txHash: string }
  | { type: "FINALIZED"; blockHash: string; txHash: string }
  | { type: "ERROR"; error: string; txHash?: string };

export type TransactionEventHandler = (event: TransactionEventType) => void;

export interface ApiTransactionResult {
  success: boolean;
  blockHash: string | null;
  status?: "inBlock" | "finalized" | "pending";
  error?: string;
  events?: any[];
  warning?: string;
  extrinsicId?: string;
  hash?: string;
  txHash?: string;
}

export interface PendingTx {
  id: string;
  timeoutId?: NodeJS.Timeout;
  intervalId?: NodeJS.Timeout;
}

export interface RawTransaction {
  id?: string;
  type?: string;
  timestamp?: string | number;
  status?: string;
  message?: string;
  senderAddress?: string;
  details?: {
    recipient?: string;
    amount?: string;
    data?: string;
  };
}

export interface TransactionsPaginatedProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
  isLoading?: boolean;
}
