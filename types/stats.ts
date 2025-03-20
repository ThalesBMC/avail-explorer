export interface ChainStats {
  chain: string;
  nodeName: string;
  nodeVersion: string;
  blocks: number;
  finalized: string;

  totalIssuance: string;
  validators: number;
  blockTime: number;
  blobSize24h?: {
    totalSize: string;
    submissionCount: number;
  };
}

export interface StatCardProps {
  title: string;
  value: string | number;
  isLoading: boolean;
  error: any;
  isText?: boolean;
  suffix?: string;
}
