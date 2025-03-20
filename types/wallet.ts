export type Account = {
  address: string;
  meta: {
    name?: string;
    source: string;
  };
};

export interface WalletState {
  selectedAccount: string | null;
  accounts: Account[];
  setSelectedAccount: (account: string | null) => void;
  setAccounts: (accounts: Account[]) => void;
  disconnect: () => void;
}

export interface ConnectionStatus {
  rpc: boolean;
  indexer: boolean;
  internet: boolean;
}
