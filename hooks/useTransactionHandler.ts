import { useCallback, useState } from "react";
import { useTransactionStore } from "@/stores/TransactionStore";
import { useWalletStore } from "@/stores/WalletStore";
import { transferTokens, submitData } from "@/api/avail-client";
import { TransferFormValues, DataFormValues } from "@/types/actions";
import { useQueryClient } from "@tanstack/react-query";
import { balanceQueryKey } from "@/utils/queryKeys";
import { TransactionResult } from "@/types/transaction";
import { EXPLORER_EXTRINSIC_URL } from "@/utils/constant";

export const useTransactionHandler = () => {
  const { selectedAccount } = useWalletStore();
  const { addTransaction, updateTransactionStatus } = useTransactionStore();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = useCallback(
    async (data: TransferFormValues): Promise<TransactionResult> => {
      if (!selectedAccount) {
        return { success: false, error: "No account selected" };
      }

      setIsLoading(true);
      const txId = Date.now().toString();

      // Add initial transaction
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

      return new Promise((resolve) => {
        try {
          transferTokens(
            selectedAccount,
            data.recipient,
            data.amount,
            (event) => {
              const explorerUrl = event.txHash
                ? `${EXPLORER_EXTRINSIC_URL}${event.txHash}`
                : undefined;
              console.log("event", event, explorerUrl);
              switch (event.type) {
                case "BROADCAST":
                  updateTransactionStatus(
                    txId,
                    "pending",
                    "Transaction broadcasted to network",
                    explorerUrl
                  );
                  break;

                case "PENDING":
                  updateTransactionStatus(
                    txId,
                    "pending",
                    "Transaction pending confirmation...",
                    explorerUrl
                  );
                  resolve({
                    success: true,
                    status: "pending",
                    txHash: event.txHash,
                    explorerUrl,
                  });
                  break;

                case "IN_BLOCK":
                  updateTransactionStatus(
                    txId,
                    "success",
                    explorerUrl
                      ? `Transaction in block ${event.blockHash}`
                      : "Transaction in block"
                  );
                  queryClient.invalidateQueries({
                    queryKey: balanceQueryKey(selectedAccount),
                  });
                  resolve({
                    success: true,
                    status: "inBlock",
                    txHash: event.txHash,
                    blockHash: event.blockHash,
                    explorerUrl,
                  });
                  break;

                case "FINALIZED":
                  updateTransactionStatus(
                    txId,
                    "success",
                    `Transaction finalized in block ${event.blockHash}`,
                    explorerUrl
                  );
                  queryClient.invalidateQueries({
                    queryKey: balanceQueryKey(selectedAccount),
                  });
                  resolve({
                    success: true,
                    status: "finalized",
                    txHash: event.txHash,
                    blockHash: event.blockHash,
                    explorerUrl,
                  });
                  break;

                case "ERROR":
                  updateTransactionStatus(
                    txId,
                    "error",
                    `Transaction failed: ${event.error}`,
                    explorerUrl
                  );
                  resolve({
                    success: false,
                    error: event.error,
                    txHash: event.txHash,
                    explorerUrl,
                  });
                  setIsLoading(false);
                  break;
              }
            }
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Transaction failed";
          updateTransactionStatus(txId, "error", errorMessage);
          resolve({ success: false, error: errorMessage });
          setIsLoading(false);
        }
      });
    },
    [selectedAccount, addTransaction, updateTransactionStatus, queryClient]
  );

  const handleDataSubmit = useCallback(
    async (data: DataFormValues): Promise<TransactionResult> => {
      if (!selectedAccount) {
        return { success: false, error: "No account selected" };
      }

      setIsLoading(true);
      const txId = Date.now().toString();

      // Add initial transaction
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

      return new Promise((resolve) => {
        try {
          submitData(selectedAccount, data.data, (event) => {
            const explorerUrl = event.txHash
              ? `${EXPLORER_EXTRINSIC_URL}${event.txHash}`
              : undefined;

            switch (event.type) {
              case "BROADCAST":
                updateTransactionStatus(
                  txId,
                  "pending",
                  "Data submission broadcasted to network",
                  explorerUrl
                );
                break;

              case "PENDING":
                updateTransactionStatus(
                  txId,
                  "pending",
                  "Data submission pending confirmation...",
                  explorerUrl
                );
                resolve({
                  success: true,
                  status: "pending",
                  txHash: event.txHash,
                  explorerUrl,
                });
                break;

              case "IN_BLOCK":
                updateTransactionStatus(
                  txId,
                  "success",
                  `Data submission included in block ${event.blockHash}`,
                  explorerUrl
                );
                queryClient.invalidateQueries({
                  queryKey: balanceQueryKey(selectedAccount),
                });
                resolve({
                  success: true,
                  status: "inBlock",
                  txHash: event.txHash,
                  blockHash: event.blockHash,
                  explorerUrl,
                });
                break;

              case "FINALIZED":
                updateTransactionStatus(
                  txId,
                  "success",
                  `Data submission finalized in block ${event.blockHash}`,
                  explorerUrl
                );
                queryClient.invalidateQueries({
                  queryKey: balanceQueryKey(selectedAccount),
                });
                resolve({
                  success: true,
                  status: "finalized",
                  txHash: event.txHash,
                  blockHash: event.blockHash,
                  explorerUrl,
                });
                break;

              case "ERROR":
                updateTransactionStatus(
                  txId,
                  "error",
                  `Data submission failed: ${event.error}`,
                  explorerUrl
                );
                resolve({
                  success: false,
                  error: event.error,
                  txHash: event.txHash,
                  explorerUrl,
                });
                setIsLoading(false);
                break;
            }
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Data submission failed";
          updateTransactionStatus(txId, "error", errorMessage);
          resolve({ success: false, error: errorMessage });
          setIsLoading(false);
        }
      });
    },
    [selectedAccount, addTransaction, updateTransactionStatus, queryClient]
  );

  return {
    handleTransfer,
    handleDataSubmit,
    isLoading,
  };
};
