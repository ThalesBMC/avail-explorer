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

export interface TransactionsPaginatedProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
  isLoading?: boolean;
}
