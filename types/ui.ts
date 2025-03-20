export interface StatusCardProps {
  title: string;
  status: string;
  isActive: boolean;
}

export interface StatusCardsGroupProps {
  isConnected: {
    rpc: boolean;
    indexer: boolean;
    internet: boolean;
  };
}

export interface StatusBadgeProps {
  status: "idle" | "pending" | "success" | "error";
  message: string;
}
