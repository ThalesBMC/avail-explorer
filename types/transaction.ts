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
  status?: "inBlock" | "finalized";
  hash?: string;
  txHash?: string;
  extrinsicId?: string;
}

export interface ApiTransactionResult {
  success: boolean;
  blockHash: string | null;
  status?: "inBlock" | "finalized";
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
