import { FC, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransactionHandler } from "@/hooks/useTransactionHandler";
import { DataFormValues } from "@/types/actions";

const dataSchema = z.object({
  data: z
    .string()
    .min(1, "Data is required")
    .max(10000, "Data must be less than 10000 characters")
    .refine((val) => val.trim().length > 0, "Data cannot be only whitespace"),
});

interface DataFormProps {
  onStatusChange: (
    status: "idle" | "pending" | "success" | "error",
    message: string
  ) => void;
}

export const DataForm: FC<DataFormProps> = ({ onStatusChange }) => {
  const { handleDataSubmit } = useTransactionHandler();

  const form = useForm<DataFormValues>({
    resolver: zodResolver(dataSchema),
    defaultValues: { data: "" },
    mode: "onChange",
  });

  const isSubmitting = form.formState.isSubmitting;

  const charCount = useMemo(
    () => form.watch("data")?.length || 0,
    [form.watch("data"), form]
  );

  const onSubmit = useCallback(
    async (data: DataFormValues) => {
      onStatusChange("pending", "Submitting data...");

      try {
        const result = await handleDataSubmit(data);

        if (result?.success) {
          onStatusChange("success", "Data submitted successfully!");
          form.reset();
        } else {
          onStatusChange(
            "error",
            `Data submission failed: ${result?.error || "Unknown error"}`
          );
        }
      } catch (error: Error | unknown) {
        console.error("Data submit error:", error);
        onStatusChange(
          "error",
          `Data submission failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    [handleDataSubmit, onStatusChange, form.reset]
  );

  const textareaClassName = useMemo(
    () =>
      `w-full p-2 border rounded-md focus:ring-primary-light focus:border-primary-light ${
        form.formState.errors.data ? "border-red-500" : "border-gray-300"
      }`,
    [form.formState.errors.data]
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Data
        </label>
        <textarea
          {...form.register("data")}
          className={textareaClassName}
          placeholder="Enter data to submit"
          rows={4}
        />
        <div className="mt-1 flex justify-between">
          <div>
            {form.formState.errors.data && (
              <p className="text-sm text-red-600">
                {form.formState.errors.data.message}
              </p>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {charCount}/10000 characters
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !form.formState.isValid}
        className="w-full"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </span>
        ) : (
          "Submit Data"
        )}
      </Button>
    </form>
  );
};
