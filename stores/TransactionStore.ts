import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TransactionStore } from "@/types/transaction";

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set) => ({
      transactions: [],
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [transaction, ...state.transactions],
        })),
      updateTransactionStatus: (id, status, message) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, status, message } : tx
          ),
        })),
    }),
    {
      name: "transaction-storage",
    }
  )
);
