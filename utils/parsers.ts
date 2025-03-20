/**
 * Utility functions for parsing and deserializing Avail data
 */
import { Transaction as GraphQLTransaction } from "@/types/graphql";
import {
  TransactionSchema,
  SafeTransaction,
  ChainStatsSchema,
  SafeChainStats,
  BlobSize24hSchema,
  SafeBlobSize24h,
  BalanceSchema,
  SafeBalance,
} from "@/types/models";

/**
 * Parse raw transaction data from GraphQL into a safe transaction object
 * @param rawData Raw transaction data from GraphQL
 * @returns Safely parsed transaction with default values for missing fields
 */
export function parseTransaction(rawData: any): SafeTransaction {
  try {
    // Map GraphQL transaction format to our application format
    const mappedData = {
      id: rawData.id || rawData.hash || "",
      type: mapTransactionType(rawData),
      timestamp: parseTimestamp(rawData.timestamp),
      status: rawData.success ? "success" : "error",
      message: generateTransactionMessage(rawData),
      senderAddress: rawData.signer || "",
      details: extractTransactionDetails(rawData),
      // Keep original fields
      ...rawData,
    };

    // Parse through schema to ensure all fields have valid values
    return TransactionSchema.parse(mappedData);
  } catch (error) {
    console.error("Error parsing transaction:", error);
    // Return a safe default transaction
    return TransactionSchema.parse({});
  }
}

/**
 * Parse chain statistics data
 * @param rawData Raw chain stats data
 * @returns Safely parsed chain stats with default values for missing fields
 */
export function parseChainStats(rawData: any): SafeChainStats {
  try {
    return ChainStatsSchema.parse(rawData);
  } catch (error) {
    console.error("Error parsing chain stats:", error);
    return ChainStatsSchema.parse({});
  }
}

/**
 * Parse blob size statistics
 * @param rawData Raw blob size data
 * @returns Safely parsed blob size data with default values for missing fields
 */
export function parseBlobSize24h(rawData: any): SafeBlobSize24h {
  try {
    return BlobSize24hSchema.parse(rawData);
  } catch (error) {
    console.error("Error parsing blob size:", error);
    return BlobSize24hSchema.parse({});
  }
}

/**
 * Parse account balance data
 * @param rawData Raw balance data
 * @returns Safely parsed balance with default values for missing fields
 */
export function parseBalance(rawData: any): SafeBalance {
  try {
    return BalanceSchema.parse(rawData);
  } catch (error) {
    console.error("Error parsing balance:", error);
    return BalanceSchema.parse({});
  }
}

/**
 * Maps transaction module/method to our internal transaction type
 */
function mapTransactionType(rawData: any): "transfer" | "data" | "unknown" {
  if (!rawData) return "unknown";

  const module = rawData.module?.toLowerCase() || "";
  const method = rawData.argsName?.toLowerCase() || "";

  if (
    module === "balances" &&
    (method.includes("transfer") || method.includes("send"))
  ) {
    return "transfer";
  } else if (module === "dataavailability" && method.includes("submitdata")) {
    return "data";
  }

  return "unknown";
}

/**
 * Extracts transaction details from raw data
 */
function extractTransactionDetails(rawData: any): Record<string, any> {
  try {
    const details: Record<string, any> = {};

    if (!rawData) return details;

    // Try to parse args if available
    if (rawData.argsValue) {
      try {
        const args = JSON.parse(rawData.argsValue);

        // Handle transfer details
        if (args.dest || args.destination) {
          details.recipient = args.dest?.id || args.destination?.id || "";
        }

        if (args.value) {
          details.amount = args.value.toString();
        }

        // Handle data submission
        if (args.data) {
          details.data = args.data;
        }
      } catch {
        // If JSON parsing fails, try to extract details in some other way
      }
    }

    return details;
  } catch (error) {
    console.error("Error extracting transaction details:", error);
    return {};
  }
}

/**
 * Generates a human-readable transaction message
 */
function generateTransactionMessage(rawData: any): string {
  try {
    const type = mapTransactionType(rawData);
    const success = rawData.success ? "successful" : "failed";

    if (type === "transfer") {
      const recipient =
        extractTransactionDetails(rawData).recipient || "unknown recipient";
      return `${success} transfer to ${recipient}`;
    } else if (type === "data") {
      return `${success} data submission`;
    }

    return `${success} transaction`;
  } catch (error) {
    console.error("Error generating transaction message:", error);
    return "Transaction";
  }
}

/**
 * Parse timestamp from different formats to a number
 */
function parseTimestamp(timestamp: any): number {
  if (!timestamp) return Date.now();

  try {
    if (typeof timestamp === "number") {
      return timestamp;
    } else if (typeof timestamp === "string") {
      return new Date(timestamp).getTime();
    }
  } catch (error) {
    console.error("Error parsing timestamp:", error);
  }

  return Date.now();
}
