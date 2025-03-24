import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Transaction, TransactionStatus } from "@/types/actions";

interface TransactionStore {
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  updateTransactionStatus: (
    id: string,
    status: TransactionStatus,
    message: string,
    explorerUrl?: string
  ) => void;
  getTransaction: (id: string) => Transaction | undefined;
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [transaction, ...state.transactions],
        })),
      updateTransactionStatus: (id, status, message, explorerUrl) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id
              ? {
                  ...tx,
                  status,
                  message,
                  explorerUrl: explorerUrl || tx.explorerUrl,
                }
              : tx
          ),
        })),
      getTransaction: (id) => get().transactions.find((tx) => tx.id === id),
    }),
    {
      name: "transaction-storage",
    }
  )
);
