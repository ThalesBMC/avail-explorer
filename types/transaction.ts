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
  error?: string;
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
