"use client";

import { Transaction } from "@/types/graphql";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { TransactionRow } from "./TransactionRow";
import { LoadingSkeleton } from "@/components/ui/loadingSkeleton";
import { formatRelativeTime } from "@/utils";
import { useTransactions } from "@/hooks/useTransactions";

interface LatestTransactionsProps {
  page?: number;
  itemsPerPage?: number;
}

export function LatestTransactions({
  page = 1,
  itemsPerPage = 5,
}: LatestTransactionsProps) {
  const {
    transactions: paginatedTransactions,
    isInitialLoading,
    isRefreshing,
    error,
    lastRefresh,
    handleRefresh,
  } = useTransactions({ page, itemsPerPage });

  if (isInitialLoading) {
    return <LoadingSkeleton itemsPerPage={itemsPerPage} />;
  }

  if (error) {
    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50 text-red-800">
        <p>Error loading transactions: {error.message}</p>
        <Button variant="outline" className="mt-2" onClick={handleRefresh}>
          Retry
        </Button>
      </div>
    );
  }

  if (paginatedTransactions.length === 0) {
    return (
      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-center">
        <p>No transactions found</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {isRefreshing && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-gray-600">Refreshing...</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          <span>Last updated: {formatRelativeTime(lastRefresh.getTime())}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1"
        >
          {isRefreshing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                Method
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                Module
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                Hash
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction as unknown as Transaction}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
