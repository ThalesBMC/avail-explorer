import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WalletState } from "@/types/wallet";

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      selectedAccount: null,
      accounts: [],
      setSelectedAccount: (account) => set({ selectedAccount: account }),
      setAccounts: (accounts) => set({ accounts }),
      disconnect: () => set({ selectedAccount: null, accounts: [] }),
    }),
    {
      name: "wallet-storage",
    }
  )
);
