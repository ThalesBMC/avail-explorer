export type TransactionType = "transfer" | "data";
export type TransactionStatus = "pending" | "success" | "error";

export interface Transaction {
  id: string;
  type: TransactionType;
  timestamp: number;
  status: TransactionStatus;
  message: string;
  senderAddress: string;
  details: {
    recipient?: string;
    amount?: string;
    data?: string;
  };
}

export interface Balance {
  free: string;
  reserved: string;
  frozen: string;
}

export interface TransferFormValues {
  recipient: string;
  amount: string;
}

export interface DataFormValues {
  data: string;
}

export interface ChainStats {
  totalIssuance: string;
  validators: number;
  blockTime: number;
  blocks: number;
  blobSize24h?: {
    totalSize: number;
    submissionCount: number;
  };
}
