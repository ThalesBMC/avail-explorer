import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WalletState } from "@/types/wallet";

export enum WalletStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTING = "disconnecting",
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      selectedAccount: null,
      accounts: [],
      status: WalletStatus.DISCONNECTED,
      lastConnectedWallet: null,

      // Set the selected account
      setSelectedAccount: (account) => set({ selectedAccount: account }),

      // Set available accounts
      setAccounts: (accounts) => set({ accounts }),

      // Set wallet status
      setStatus: (status) => set({ status }),

      // Set last connected wallet
      setLastConnectedWallet: (walletId) =>
        set({ lastConnectedWallet: walletId }),
    }),
    {
      name: "wallet-storage",
    }
  )
);
