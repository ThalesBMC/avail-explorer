export const queryKeys = {
  latestTransactions: "latestTransactions",
  chainStats: "chainStats",
} as const;

export const balanceQueryKey = (address: string | null) =>
  ["balance", address] as const;
