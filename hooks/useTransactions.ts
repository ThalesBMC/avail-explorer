import { useState, useRef, useCallback, useEffect } from "react";
import { useLatestTransactions } from "./useAvailData";

// Constants
export const POLLING_INTERVAL = 20000; // 20 seconds
export const REFRESH_DELAY = 500; // 500ms

interface UseTransactionsOptions {
  page?: number;
  itemsPerPage?: number;
}

export function useTransactions({
  page = 1,
  itemsPerPage = 5,
}: UseTransactionsOptions = {}) {
  const {
    data: allTransactions,
    isLoading: isInitialLoading,
    error,
    mutate,
  } = useLatestTransactions();

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate paginated data
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedTransactions = allTransactions?.slice(start, end) || [];

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await mutate();
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to refresh:", error);
    } finally {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        setIsRefreshing(false);
        refreshTimeoutRef.current = null;
      }, REFRESH_DELAY);
    }
  }, [mutate, isRefreshing]);

  // Set up polling
  useEffect(() => {
    const pollData = async () => {
      try {
        await mutate();
        setLastRefresh(new Date());
      } catch (error) {
        console.error("Failed to poll data:", error);
      }
    };

    const intervalId = setInterval(pollData, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [mutate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    transactions: paginatedTransactions,
    isInitialLoading,
    isRefreshing,
    error,
    lastRefresh,
    handleRefresh,
    allTransactions,
  };
}
