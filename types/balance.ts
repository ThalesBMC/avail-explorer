import { UseQueryResult } from "@tanstack/react-query";
import { Balance } from "./actions";

export interface UseBalanceResult {
  balance: Balance | null;
  isLoading: boolean;
  error: string | null;
  isBalanceSufficient: (amount: string) => boolean;
  refetch: () => Promise<UseQueryResult<Balance | null, Error>>;
}
