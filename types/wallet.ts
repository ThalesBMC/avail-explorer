import { WalletStatus } from "@/stores/WalletStore";
import { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

export interface WalletState {
  selectedAccount: string | null;
  accounts: InjectedAccountWithMeta[];
  status: WalletStatus;
  lastConnectedWallet: string | null;
  setSelectedAccount: (account: string | null) => void;
  setAccounts: (accounts: InjectedAccountWithMeta[]) => void;
  setStatus: (status: WalletStatus) => void;
  setLastConnectedWallet: (walletId: string | null) => void;
}

export interface ConnectionStatus {
  rpc: boolean;
  indexer: boolean;
  internet: boolean;
}
