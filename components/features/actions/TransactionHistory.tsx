import { FC } from "react";
import { Transaction } from "@/types/actions";
import { formatAddress, formatDate } from "@/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface TransactionHistoryProps {
  transactions: Transaction[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
}

export const TransactionHistory: FC<TransactionHistoryProps> = ({
  transactions,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}) => {
  // Calculate pagination
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-primary-dark mb-4">
        Transaction History
      </h2>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-1/6">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-1/6">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-1/6">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-1/6">
                  From
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-2/6">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 truncate">
                    {tx.type === "transfer" ? "Transfer" : "Data Submission"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : tx.status === "success"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tx.status === "pending"
                        ? "Pending"
                        : tx.status === "success"
                        ? "Success"
                        : "Failed"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 truncate">
                    {formatDate(tx.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500 truncate">
                    {formatAddress(tx.senderAddress)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {tx.type === "transfer" ? (
                      <div>
                        <span className="text-gray-500">To: </span>
                        <span className="font-mono">
                          {formatAddress(tx.details.recipient)}
                        </span>
                        <br />
                        <span className="text-gray-500">Amount: </span>
                        <span>{tx.details.amount} AVAIL</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-gray-500">Data: </span>
                        <span className="font-mono">
                          {tx.details.data && tx.details.data.length > 20
                            ? `${tx.details.data.substring(0, 20)}...`
                            : tx.details.data}
                        </span>
                      </div>
                    )}
                    <div className="text-xs mt-1 flex flex-col gap-1">
                      {tx.status === "error" && (
                        <span className="text-red-600">{tx.message}</span>
                      )}
                      {tx.explorerUrl && (
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline whitespace-nowrap"
                        >
                          View in Explorer
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="py-4 px-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, transactions.length)} of{" "}
                {transactions.length} transactions
              </p>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(currentPage - page) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    if (index > 0 && page - array[index - 1] > 1) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};
