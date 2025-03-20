import { useQuery } from "@tanstack/react-query";
import { useWalletStore } from "@/stores/WalletStore";
import { getAccountBalance } from "@/api/avail-client";

import { balanceQueryKey } from "@/utils/queryKeys";
import { UseBalanceResult } from "@/types/balance";

// Minimum reserve to account for transaction fees.  This value is based on the base fee.
// See: https://docs.availproject.org/docs/learn-about-avail/tx-pricing
const MIN_RESERVE = 0.124; //  Base fee is currently 0.124 AVAIL

export const useBalance = (): UseBalanceResult => {
  const { selectedAccount } = useWalletStore();

  const query = useQuery({
    queryKey: balanceQueryKey(selectedAccount),
    queryFn: async () => {
      if (!selectedAccount) return null;

      try {
        const balance = await getAccountBalance(selectedAccount);
        return balance;
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to fetch balance"
        );
      }
    },
    enabled: !!selectedAccount,
    refetchInterval: 15000, // Refetch every 15 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
    retry: (failureCount, error) => {
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const isBalanceSufficient = (amount: string): boolean => {
    if (!query.data) return false;

    try {
      const freeBalance = parseFloat(query.data.free);
      const transferAmount = parseFloat(amount);

      if (isNaN(freeBalance) || isNaN(transferAmount)) {
        return false;
      }

      return freeBalance >= transferAmount + MIN_RESERVE;
    } catch (error) {
      console.error("Error checking balance sufficiency:", error);
      return false;
    }
  };

  return {
    balance: query.data || null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    isBalanceSufficient,
    refetch: query.refetch,
  };
};
