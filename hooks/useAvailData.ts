import { useQuery, UseQueryResult } from "@tanstack/react-query";

import { getChainStats, getLatestTransactions } from "@/api/avail-client";
import { Transaction, ChainStats } from "@/types/actions";
import { queryKeys } from "@/utils/queryKeys";

type UseLatestTransactionsResult = Omit<
  UseQueryResult<Transaction[], Error>,
  "mutate"
> & {
  mutate: () => Promise<void>;
};

type UseChainStatsResult = UseQueryResult<ChainStats, Error>;

/**
 * Hook to fetch latest transactions
 */
export function useLatestTransactions(
  limit: number = 10
): UseLatestTransactionsResult {
  const query = useQuery({
    queryKey: [queryKeys.latestTransactions, limit] as const,
    queryFn: async ({ queryKey: [_, limit] }): Promise<Transaction[]> => {
      try {
        const data = await getLatestTransactions(limit);
        // Ensure the data matches our expected Transaction type
        return data.map((tx: any) => ({
          type: tx.type || "unknown",
          status: tx.status || "pending",
          message: tx.message || "",
          senderAddress: tx.senderAddress || "",
          details: tx.details || {},
          ...tx,
        }));
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to fetch transactions"
        );
      }
    },
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 60 * 1000, // Cache for 1 minute
    retry: (failureCount) => {
      return failureCount < 3;
    },
  });

  return {
    ...query,
    mutate: async () => {
      await query.refetch();
    },
  } as UseLatestTransactionsResult;
}

/**
 * Hook to fetch chain statistics
 */
export function useChainStats(): UseChainStatsResult {
  return useQuery({
    queryKey: [queryKeys.chainStats] as const,
    queryFn: async (): Promise<ChainStats> => {
      try {
        const data = await getChainStats();
        return data as ChainStats;
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to fetch chain stats"
        );
      }
    },
    refetchInterval: 12000, // Refetch every 12 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    gcTime: 30000, // Cache for 30 seconds
    retry: (failureCount) => {
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}
