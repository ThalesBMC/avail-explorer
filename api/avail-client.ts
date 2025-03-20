import { ApiPromise, HttpProvider, WsProvider } from "@polkadot/api";
import {
  web3Accounts,
  web3Enable,
  web3FromSource,
} from "@polkadot/extension-dapp";
import type { InjectedExtension } from "@polkadot/extension-inject/types";
import {
  fetchGraphQLData,
  GET_24H_BLOB_SIZE,
  GET_LATEST_TRANSACTIONS,
} from "./graphql";
import { TransactionsResponse, BlobSize24hResponse } from "@/types/graphql";

import { Account, SDK, BN } from "avail-js-sdk";
import { signedExtensions, types } from "avail-js-sdk";
import { isNumber } from "util";
import { ChainStats } from "@/types/stats";

// Use Turing RPC endpoint
const AVAIL_RPC_URL = "wss://turing-rpc.avail.so/ws";

// Cache for the Avail API instance
let apiInstance: ApiPromise | null = null;
let extensions: InjectedExtension[] = [];
let extensionsInitialized: Record<string, boolean> = {};

/**
 * Connect to wallet extensions
 */
export async function connectWallet(appName: string = "Avail Explorer") {
  try {
    extensions = await web3Enable(appName);

    if (extensions.length === 0) {
      throw new Error(
        "No extension found. Please install Polkadot.js or SubWallet extension"
      );
    }

    return extensions;
  } catch (error) {
    console.error("Failed to connect wallet:", error);
    throw error;
  }
}

/**
 * Get accounts from connected wallet
 */
export async function getAccounts() {
  try {
    if (extensions.length === 0) {
      await connectWallet();
    }

    const allAccounts = await web3Accounts();
    return allAccounts;
  } catch (error) {
    console.error("Failed to get accounts:", error);
    throw error;
  }
}

/**
 * Initialize and get the Avail API instance
 */
export async function getAvailApi(): Promise<ApiPromise> {
  if (!apiInstance) {
    try {
      const provider = new WsProvider(AVAIL_RPC_URL);
      apiInstance = await ApiPromise.create({
        provider,
        types,
        signedExtensions,
      });
      console.log("Connected to Avail network");
    } catch (error) {
      console.error("Failed to connect to Avail network:", error);
      throw error;
    }
  }
  return apiInstance;
}

/**
 * Get injector metadata for Avail
 */
function getInjectorMetadata(api: ApiPromise) {
  return {
    chain: api.runtimeChain.toString(),
    specVersion: api.runtimeVersion.specVersion.toNumber(),
    tokenDecimals: api.registry.chainDecimals[0] || 18,
    tokenSymbol: api.registry.chainTokens[0] || "AVAIL",
    genesisHash: api.genesisHash.toHex(),
    ss58Format: isNumber(api.registry.chainSS58) ? api.registry.chainSS58 : 0,
    chainType: "substrate" as "substrate",
    icon: "substrate",
    types: types as any,
    userExtensions: signedExtensions,
  };
}

/**
 * Get the latest block from Avail
 */
export async function getLatestBlock() {
  const api = await getAvailApi();
  try {
    const blockHash = await api.rpc.chain.getFinalizedHead();
    return await api.rpc.chain.getBlock(blockHash);
  } catch (error) {
    console.error("Failed to get latest block:", error);
    throw error;
  }
}

/**
 * Get account balance for a specific address
 */
export async function getAccountBalance(address: string) {
  const api = await getAvailApi();
  try {
    console.log("Getting account balance for address:", address);
    const accountInfo = await api.query.system.account(address);
    console.log("Balance:", accountInfo);

    const accountData = (accountInfo as any).data;
    return {
      free: formatBalance(accountData.free.toString()),
      reserved: formatBalance(accountData.reserved.toString()),
      frozen: formatBalance(accountData.frozen.toString()),
    };
  } catch (error) {
    console.error("Failed to get account balance:", error);
    throw error;
  }
}

/**
 * Format balance
 *
 */
function formatBalance(balanceInPlanck: string): string {
  const decimals = 18;
  const balance = BigInt(balanceInPlanck);
  const divisor = BigInt(10) ** BigInt(decimals);

  const whole = balance / divisor;
  const fraction = balance % divisor;

  // Format with up to 6 decimal places for display
  const fractionStr = fraction.toString().padStart(decimals, "0");
  const displayDecimals = 6;
  const shortenedFraction = fractionStr.substring(0, displayDecimals);

  // Only show decimals if they exist
  return shortenedFraction === "0".repeat(displayDecimals)
    ? whole.toString()
    : `${whole}.${shortenedFraction}`;
}

/**
 * Submit data to Avail network using polkadot.js api.tx approach
 */
export async function submitData(address: string, data: string) {
  let api = await getAvailApi();

  try {
    if (!(api && api.isConnected)) {
      const provider = new HttpProvider(AVAIL_RPC_URL);
      api = await ApiPromise.create({
        provider,
        types,
        signedExtensions,
      });
    }

    const accounts = await web3Accounts();
    const account = accounts.find((acc) => acc.address === address);
    if (!account) {
      throw new Error("Account not found");
    }

    const injector = await web3FromSource(account.meta.source);

    if (injector.metadata && !extensionsInitialized[injector.name]) {
      const metadata = getInjectorMetadata(api);
      console.log("Initializing extension metadata:", metadata);
      await injector.metadata.provide(metadata as any);
      extensionsInitialized[injector.name] = true;
      console.log(`Extension ${injector.name} metadata initialized`);
    }

    // Create and send the transaction
    const tx = api.tx.dataAvailability.submitData(data);
    console.log("Sending transaction with data:", data);

    return new Promise((resolve, reject) => {
      tx.signAndSend(
        address,
        {
          signer: injector.signer,
          app_id: 328,
        } as any,
        ({ status, isError, events }) => {
          console.log("Transaction status:", status?.toHuman());

          if (isError) {
            console.error("Transaction error:", events);
            reject(new Error("Transaction failed"));
            return;
          }

          // Check all possible status conditions
          if (status) {
            if (status.isInvalid) console.log("Transaction status: Invalid");
            if (status.isBroadcast)
              console.log("Transaction status: Broadcast");
            if (status.isInBlock) {
              console.log(
                "Transaction included in block:",
                status.asInBlock.toString()
              );
              resolve(status.asInBlock.toString());
            }
            if (status.isFinalized) {
              console.log(
                "Transaction finalized in block:",
                status.asFinalized.toString()
              );
              resolve(status.asFinalized.toString());
            }
            if (status.isReady) console.log("Transaction status: Ready");
            if (status.isFuture) console.log("Transaction status: Future");
          }
        }
      ).catch((error) => {
        console.error("SignAndSend error:", error);
        reject(error);
      });
    });
  } catch (error) {
    console.error("Failed to submit data:", error);
    throw error;
  }
}

/**
 * Transfer tokens from one account to another
 * @param fromAddress The address sending tokens
 * @param toAddress The address receiving tokens
 * @param amount The amount in AVAIL to transfer
 * @returns Promise that resolves to the block hash when the transaction is included
 */
export async function transferTokens(
  fromAddress: string,
  toAddress: string,
  amount: string
) {
  let api = await getAvailApi();

  try {
    if (!(api && api.isConnected)) {
      const provider = new WsProvider(AVAIL_RPC_URL);
      api = await ApiPromise.create({
        provider,
        types,
        signedExtensions,
      });
    }

    const accounts = await web3Accounts();
    const account = accounts.find((acc) => acc.address === fromAddress);
    if (!account) {
      throw new Error("Account not found");
    }

    const injector = await web3FromSource(account.meta.source);

    // Initialize extension metadata if not already done
    if (injector.metadata && !extensionsInitialized[injector.name]) {
      const metadata = getInjectorMetadata(api);
      await injector.metadata.provide(metadata as any);
      extensionsInitialized[injector.name] = true;
    }

    // Convert amount to base units
    const amountInPlanck = convertToBaseUnits(amount);
    const tx = api.tx.balances.transferKeepAlive(toAddress, amountInPlanck);

    return new Promise((resolve, reject) => {
      tx.signAndSend(
        fromAddress,
        {
          signer: injector.signer,
        },
        async ({ status, dispatchError, events }) => {
          if (dispatchError) {
            if (dispatchError.isModule) {
              // Get the module error
              const decoded = api.registry.findMetaError(
                dispatchError.asModule
              );
              const { docs, name, section } = decoded;
              reject(new Error(`${section}.${name}: ${docs.join(" ")}`));
            } else {
              // Handle other errors
              reject(new Error(dispatchError.toString()));
            }
            return;
          }

          if (status.isInBlock || status.isFinalized) {
            // Check events for transfer success
            const transferEvent = events.find(
              ({ event }) =>
                event.section === "balances" && event.method === "Transfer"
            );

            if (transferEvent) {
              resolve({
                blockHash: status.isFinalized
                  ? status.asFinalized
                  : status.asInBlock,
                success: true,
                events: events.map(({ event }) => ({
                  method: event.method,
                  section: event.section,
                  data: event.data.toHuman(),
                })),
              });
            }
          }
        }
      ).catch((error) => {
        console.error("SignAndSend error:", error);
        reject(error);
      });
    });
  } catch (error) {
    console.error("Failed to transfer tokens:", error);
    throw error;
  }
}

/**
 * Convert from AVAIL to base units
 *
 */
function convertToBaseUnits(amount: string): string {
  const decimals = 18;

  const [whole, fraction = ""] = amount.split(".");

  const wholeBigInt = BigInt(whole) * BigInt(10) ** BigInt(decimals);

  // Handle the fractional part if it exists
  let fractionBigInt = BigInt(0);
  if (fraction) {
    const paddedFraction = fraction
      .padEnd(decimals, "0")
      .substring(0, decimals);
    fractionBigInt = BigInt(paddedFraction);
  }

  // Combine whole and fractional parts
  return (wholeBigInt + fractionBigInt).toString();
}

/**
 * Get the latest transactions from Avail
 */
export async function getLatestTransactions(limit = 10) {
  try {
    const data = await fetchGraphQLData<TransactionsResponse>(
      GET_LATEST_TRANSACTIONS,
      { first: limit }
    );
    return data.extrinsics.edges.map((edge) => edge.node);
  } catch (error) {
    console.error("Failed to get latest transactions:", error);
    throw error;
  }
}

/**
 * Get blob size statistics for the last 24 hours
 */
export async function get24hBlobSize() {
  try {
    const data = await fetchGraphQLData<BlobSize24hResponse>(GET_24H_BLOB_SIZE);
    return {
      totalSize: data.dataSubmissions.aggregates.sum.byteSize,
      submissionCount: data.dataSubmissions.totalCount,
    };
  } catch (error) {
    console.error("Failed to get 24h blob size:", error);
    throw error;
  }
}

/**
 * Get chain statistics from Avail
 */
export async function getChainStats(): Promise<ChainStats> {
  const api = await getAvailApi();
  try {
    // Basic chain info
    const [chain, nodeName, nodeVersion] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version(),
    ]);

    // Block and finalization info
    const [blockNumber, blockHash, finalizedNumber] = await Promise.all([
      api.derive.chain.bestNumber(),
      api.rpc.chain.getFinalizedHead(),
      api.derive.chain.bestNumberFinalized(),
    ]);

    // System stats and blob size
    const [totalIssuance, validators, previousBlock, blobSize24h] =
      await Promise.all([
        api.query.balances.totalIssuance(),
        api.query.session.validators(),
        api.rpc.chain.getBlock(),
        get24hBlobSize(),
      ]);

    return {
      chain: chain.toString(),
      nodeName: nodeName.toString(),
      nodeVersion: nodeVersion.toString(),
      blocks: blockNumber.toNumber(),
      finalized: blockHash.toString(),
      totalIssuance: formatBalance(totalIssuance.toString()),
      validators: validators.toString().length,
      blockTime: 6,
      blobSize24h,
    };
  } catch (error) {
    console.error("Failed to get chain stats:", error);
    throw error;
  }
}
