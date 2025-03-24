import { useCallback, useState, useRef } from "react";
import { useTransactionStore } from "@/stores/TransactionStore";
import { useWalletStore } from "@/stores/WalletStore";
import { transferTokens, submitData } from "@/api/avail-client";
import { TransferFormValues, DataFormValues } from "@/types/actions";
import { useQueryClient } from "@tanstack/react-query";
import { balanceQueryKey } from "@/utils/queryKeys";
import {
  PendingTx,
  TransactionResult,
  ApiTransactionResult,
} from "@/types/transaction";
import { EXPLORER_EXTRINSIC_URL } from "@/utils/constant";

export const useTransactionHandler = () => {
  const { selectedAccount } = useWalletStore();
  const { addTransaction, updateTransactionStatus } = useTransactionStore();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const pendingTxsRef = useRef<Record<string, PendingTx>>({});

  // Helper function to clean up a transaction
  const cleanupTransaction = (txKey: string) => {
    if (pendingTxsRef.current[txKey]?.timeoutId) {
      clearTimeout(pendingTxsRef.current[txKey].timeoutId);
    }
    if (pendingTxsRef.current[txKey]?.intervalId) {
      clearInterval(pendingTxsRef.current[txKey].intervalId);
    }
    delete pendingTxsRef.current[txKey];
  };

  const handleTransfer = useCallback(
    async (data: TransferFormValues): Promise<TransactionResult> => {
      if (!selectedAccount) {
        return { success: false, error: "No account selected" };
      }

      setIsLoading(true);

      const txKey = `transfer-${selectedAccount}-${data.recipient}-${data.amount}`;

      const txId = Date.now().toString();

      // Add to pending transactions
      pendingTxsRef.current[txKey] = { id: txId };

      addTransaction({
        id: txId,
        type: "transfer",
        timestamp: Date.now(),
        status: "pending",
        message: "Transaction in progress...",
        senderAddress: selectedAccount,
        details: {
          recipient: data.recipient,
          amount: data.amount,
        },
      });

      try {
        updateTransactionStatus(
          txId,
          "pending",
          "Transaction submitted. Waiting for confirmation..."
        );

        const result = (await transferTokens(
          selectedAccount,
          data.recipient,
          data.amount
        )) as ApiTransactionResult;

        const explorerUrl = result.txHash
          ? `${EXPLORER_EXTRINSIC_URL}${result.txHash}`
          : undefined;

        if (!result.success) {
          // Transação com erro
          updateTransactionStatus(
            txId,
            "error",
            `Transaction failed: ${result.error}`,
            explorerUrl
          );

          // Remove from pending transactions immediately
          cleanupTransaction(txKey);

          return {
            success: false,
            error: result.error,
            txHash: result.txHash,
            explorerUrl,
          };
        }

        if (result.status === "inBlock" || result.status === "finalized") {
          // Transaction in block or finalized - show as success immediately
          updateTransactionStatus(
            txId,
            "success",
            `Transaction completed successfully`,
            explorerUrl
          );

          // Store the transaction details
          const txDetails = {
            recipient: data.recipient,
            amount: data.amount,
            txHash: result.txHash,
          };

          // Update transaction with updated details
          const { transactions } = useTransactionStore.getState();
          const txIndex = transactions.findIndex((t) => t.id === txId);
          if (txIndex >= 0) {
            const updatedTx = {
              ...transactions[txIndex],
              details: {
                ...transactions[txIndex].details,
                ...txDetails,
              },
            };
            useTransactionStore.setState({
              transactions: [
                ...transactions.slice(0, txIndex),
                updatedTx,
                ...transactions.slice(txIndex + 1),
              ],
            });
          }

          await queryClient.invalidateQueries({
            queryKey: balanceQueryKey(selectedAccount),
          });

          // Remove from pending transactions
          cleanupTransaction(txKey);

          return {
            success: true,
            status: result.status,
            txHash: result.txHash,
            explorerUrl,
          };
        }

        updateTransactionStatus(
          txId,
          "pending",
          "Transaction submitted. Waiting for confirmation...",
          explorerUrl
        );

        // Check if the transaction is finalized after some time
        if (result.txHash) {
          const checkTxInterval = setInterval(async () => {
            try {
              const { transactions } = useTransactionStore.getState();
              const tx = transactions.find((t) => t.id === txId);

              if (!tx || tx.status !== "pending") {
                clearInterval(checkTxInterval);
                return;
              }

              setTimeout(() => {
                updateTransactionStatus(
                  txId,
                  "success",
                  "Transaction completed successfully",
                  explorerUrl
                );
                clearInterval(checkTxInterval);

                // Store the transaction details
                const txDetails = {
                  recipient: data.recipient,
                  amount: data.amount,
                  txHash: result.txHash,
                };

                // Update transaction with updated details
                const { transactions } = useTransactionStore.getState();
                const txIndex = transactions.findIndex((t) => t.id === txId);
                if (txIndex >= 0) {
                  const updatedTx = {
                    ...transactions[txIndex],
                    details: {
                      ...transactions[txIndex].details,
                      ...txDetails,
                    },
                  };
                  useTransactionStore.setState({
                    transactions: [
                      ...transactions.slice(0, txIndex),
                      updatedTx,
                      ...transactions.slice(txIndex + 1),
                    ],
                  });
                }

                queryClient.invalidateQueries({
                  queryKey: balanceQueryKey(selectedAccount),
                });

                cleanupTransaction(txKey);
              }, 15000);
            } catch (err) {
              console.error("Error checking transaction status:", err);
            }
          }, 5000);

          pendingTxsRef.current[txKey].intervalId = checkTxInterval;
        }

        return { success: true };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Transaction failed";
        updateTransactionStatus(txId, "error", errorMessage);

        // Remove from pending transactions immediately on error
        cleanupTransaction(txKey);

        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [selectedAccount, addTransaction, updateTransactionStatus, queryClient]
  );

  const handleDataSubmit = useCallback(
    async (data: DataFormValues): Promise<TransactionResult> => {
      if (!selectedAccount) {
        return { success: false, error: "No account selected" };
      }

      setIsLoading(true);

      const txKey = `data-${selectedAccount}-${data.data}`;

      const txId = Date.now().toString();

      // Add to pending transactions
      pendingTxsRef.current[txKey] = { id: txId };

      // Add transaction to store with pending status
      addTransaction({
        id: txId,
        type: "data",
        timestamp: Date.now(),
        status: "pending",
        message: "Data submission in progress...",
        senderAddress: selectedAccount,
        details: {
          data: data.data,
        },
      });

      try {
        updateTransactionStatus(
          txId,
          "pending",
          "Transaction submitted. Waiting for confirmation..."
        );

        const result = (await submitData(
          selectedAccount,
          data.data
        )) as ApiTransactionResult;

        const explorerUrl = result.txHash
          ? `${EXPLORER_EXTRINSIC_URL}${result.txHash}`
          : undefined;

        if (!result.success) {
          // Transaction with error
          updateTransactionStatus(
            txId,
            "error",
            `Data submission failed: ${result.error}`,
            explorerUrl
          );

          // Remove from pending transactions immediately
          cleanupTransaction(txKey);

          return {
            success: false,
            error: result.error,
            txHash: result.txHash,
            explorerUrl,
          };
        }

        if (result.status === "inBlock" || result.status === "finalized") {
          // Transaction in block or finalized - show as success immediately
          updateTransactionStatus(
            txId,
            "success",
            `Data submitted successfully`,
            explorerUrl
          );

          // Store the transaction details
          const txDetails = {
            data: data.data,
            txHash: result.txHash,
          };

          // Update transaction with updated details
          const { transactions } = useTransactionStore.getState();
          const txIndex = transactions.findIndex((t) => t.id === txId);
          if (txIndex >= 0) {
            const updatedTx = {
              ...transactions[txIndex],
              details: {
                ...transactions[txIndex].details,
                ...txDetails,
              },
            };
            useTransactionStore.setState({
              transactions: [
                ...transactions.slice(0, txIndex),
                updatedTx,
                ...transactions.slice(txIndex + 1),
              ],
            });
          }

          await queryClient.invalidateQueries({
            queryKey: balanceQueryKey(selectedAccount),
          });

          // Remove from pending transactions
          cleanupTransaction(txKey);

          return {
            success: true,
            status: result.status,
            txHash: result.txHash,
            explorerUrl,
          };
        }

        updateTransactionStatus(
          txId,
          "pending",
          "Transaction submitted. Waiting for confirmation...",
          explorerUrl
        );

        if (result.txHash) {
          // Check if the transaction is finalized after some time
          const checkTxInterval = setInterval(async () => {
            try {
              const { transactions } = useTransactionStore.getState();
              const tx = transactions.find((t) => t.id === txId);

              if (!tx || tx.status !== "pending") {
                clearInterval(checkTxInterval);
                return;
              }

              setTimeout(() => {
                updateTransactionStatus(
                  txId,
                  "success",
                  "Data submitted successfully",
                  explorerUrl
                );
                clearInterval(checkTxInterval);

                const txDetails = {
                  data: data.data,
                  txHash: result.txHash,
                };

                // Update transaction with updated details
                const { transactions } = useTransactionStore.getState();
                const txIndex = transactions.findIndex((t) => t.id === txId);
                if (txIndex >= 0) {
                  const updatedTx = {
                    ...transactions[txIndex],
                    details: {
                      ...transactions[txIndex].details,
                      ...txDetails,
                    },
                  };
                  useTransactionStore.setState({
                    transactions: [
                      ...transactions.slice(0, txIndex),
                      updatedTx,
                      ...transactions.slice(txIndex + 1),
                    ],
                  });
                }

                queryClient.invalidateQueries({
                  queryKey: balanceQueryKey(selectedAccount),
                });

                // Remove from pending transactions
                cleanupTransaction(txKey);
              }, 15000);
            } catch (err) {
              console.error("Error checking data submission status:", err);
            }
          }, 5000);
          pendingTxsRef.current[txKey].intervalId = checkTxInterval;
        }

        return { success: true };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Data submission failed";
        updateTransactionStatus(txId, "error", errorMessage);

        // Remove from pending transactions immediately on error
        cleanupTransaction(txKey);

        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [selectedAccount, addTransaction, updateTransactionStatus, queryClient]
  );

  return {
    handleTransfer,
    handleDataSubmit,
    isLoading,
  };
};
