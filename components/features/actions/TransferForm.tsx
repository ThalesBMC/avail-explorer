import { FC, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransactionHandler } from "@/hooks/useTransactionHandler";
import { useBalance } from "@/hooks/useBalance";
import { TransferFormValues } from "@/types/actions";
import { Input } from "@/components/ui/input";

const transferSchema = z.object({
  recipient: z.string().min(1, "Recipient address is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)), "Amount must be a number")
    .refine((val) => Number(val) > 0, "Amount must be greater than 0"),
});

interface TransferFormProps {
  onStatusChange: (
    status: "idle" | "pending" | "success" | "error",
    message: string
  ) => void;
}

export const TransferForm: FC<TransferFormProps> = ({ onStatusChange }) => {
  const { handleTransfer } = useTransactionHandler();
  const { isBalanceSufficient } = useBalance();
  const [isInsufficientBalance, setIsInsufficientBalance] = useState(false);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { recipient: "", amount: "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = useCallback(
    async (data: TransferFormValues) => {
      if (!isBalanceSufficient(data.amount)) {
        setIsInsufficientBalance(true);
        return;
      }

      setIsInsufficientBalance(false);
      onStatusChange("pending", "Sending transaction...");

      try {
        const result = await handleTransfer(data);

        if (result?.success) {
          onStatusChange("success", "Transaction sent successfully!");
          form.reset();
        } else {
          onStatusChange(
            "error",
            `Transaction failed: ${result?.error || "Unknown error"}`
          );
        }
      } catch (error: Error | unknown) {
        console.error("Transfer error:", error);
        onStatusChange(
          "error",
          `Transaction failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    [handleTransfer, isBalanceSufficient, onStatusChange, form]
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Recipient Address
        </label>
        <Input
          {...form.register("recipient")}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-light focus:border-primary-light"
          placeholder="Enter recipient address"
        />
        {form.formState.errors.recipient && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.recipient.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount (AVAIL)
        </label>
        <Input
          {...form.register("amount")}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-light focus:border-primary-light"
          placeholder="Enter amount"
        />
        {form.formState.errors.amount && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.amount.message}
          </p>
        )}
        {isInsufficientBalance && (
          <p className="mt-1 text-sm text-red-600">
            Insufficient balance. Please reserve at least 0.1 AVAIL for fees.
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </span>
        ) : (
          "Send Tokens"
        )}
      </Button>
    </form>
  );
};
