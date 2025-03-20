export interface Transaction {
  id: string;
  module: string;
  timestamp: string;
  txHash: string;
  argsName: string;
  argsValue: string;
  extrinsicIndex: number;
  hash: string;
  success: boolean;
  signature: string;
  signer: string;
  feesRounded: string;
  block?: {
    height: number;
    hash: string;
    timestamp: string;
  };
}

export interface Block {
  id: string;
  hash: string;
  height: number;
  parentHash: string;
  timestamp: string;
  extrinsicRoot: string;
  extrinsicsCount: number;
  stateRoot: string;
  extrinsics?: {
    nodes: Transaction[];
  };
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string;
}

export interface TransactionsResponse {
  extrinsics: {
    edges: Array<{ node: Transaction }>;
    pageInfo: PageInfo;
  };
}

export interface BlocksResponse {
  blocks: {
    edges: Array<{ node: Block }>;
    pageInfo: PageInfo;
  };
}

export interface BlockDetailResponse {
  blocks: {
    edges: Array<{ node: Block }>;
  };
}

export interface TransactionDetailResponse {
  extrinsics: {
    edges: Array<{ node: Transaction }>;
  };
}

export interface BlobSize24hResponse {
  dataSubmissions: {
    aggregates: {
      sum: {
        byteSize: string;
      };
    };
    totalCount: number;
  };
}
