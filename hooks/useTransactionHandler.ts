import { useCallback, useState } from "react";
import { useTransactionStore } from "@/stores/TransactionStore";
import { useWalletStore } from "@/stores/WalletStore";
import { transferTokens, submitData } from "@/api/avail-client";
import { TransferFormValues, DataFormValues } from "@/types/actions";
import { useQueryClient } from "@tanstack/react-query";
import { balanceQueryKey } from "@/utils/queryKeys";
import { TransactionResult } from "@/types/transaction";

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

      try {
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

        await transferTokens(selectedAccount, data.recipient, data.amount);
        updateTransactionStatus(
          txId,
          "success",
          "Transaction completed successfully"
        );

        await queryClient.invalidateQueries({
          queryKey: balanceQueryKey(selectedAccount),
        });

        return { success: true };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Transaction failed";
        updateTransactionStatus(txId, "error", errorMessage);
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
      const txId = Date.now().toString();

      try {
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

        const blockHash = await submitData(selectedAccount, data.data);
        updateTransactionStatus(
          txId,
          "success",
          `Transaction included in block: ${blockHash}`
        );

        await queryClient.invalidateQueries({
          queryKey: balanceQueryKey(selectedAccount),
        });

        return { success: true };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Data submission failed";
        updateTransactionStatus(txId, "error", errorMessage);
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
