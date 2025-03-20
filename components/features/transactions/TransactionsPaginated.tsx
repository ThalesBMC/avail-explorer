import { LatestTransactions } from "@/components/features/transactions/LatestTransactions";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { TransactionSkeleton } from "./TransactionSkeleton";
import { TransactionsPaginatedProps } from "@/types/transaction";
import { useCallback, useMemo } from "react";

export function TransactionsPaginated({
  currentPage,
  setCurrentPage,
  itemsPerPage = 5,
  totalItems = 10,
  isLoading = false,
}: TransactionsPaginatedProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
    },
    [setCurrentPage]
  );

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  }, [currentPage, handlePageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, handlePageChange]);

  const pagesArray = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages]
  );

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          Showing transactions {(currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
        </p>
      </div>

      {isLoading ? (
        <TransactionSkeleton />
      ) : (
        <LatestTransactions page={currentPage} itemsPerPage={itemsPerPage} />
      )}

      <div className="mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={handlePreviousPage}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {pagesArray.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => handlePageChange(page)}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={handleNextPage}
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
    </div>
  );
}
