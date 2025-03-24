import { ApiPromise, HttpProvider, WsProvider } from "@polkadot/api";
import type {
  InjectedExtension,
  InjectedWindow,
} from "@polkadot/extension-inject/types";
import {
  fetchGraphQLData,
  GET_24H_BLOB_SIZE,
  GET_LATEST_TRANSACTIONS,
} from "./graphql";
import { TransactionsResponse, BlobSize24hResponse } from "@/types/graphql";
import { signedExtensions, types } from "avail-js-sdk";
import { isNumber } from "util";
import { ChainStats } from "@/types/stats";
import { AVAIL_RPC_URL } from "@/utils/constant";

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

declare global {
  interface Window extends InjectedWindow {}
}

let apiInstance: ApiPromise | null = null;
let extensions: InjectedExtension[] = [];
let extensionsInitialized: Record<string, boolean> = {};

// Dynamic imports for browser-only modules
const getPolkadotExtension = async () => {
  if (!isBrowser) {
    return {
      web3Accounts: async () => [],
      web3Enable: async () => [],
      web3FromSource: async () => ({
        signer: {},
        metadata: {
          provide: async () => {},
        },
        name: "dummy",
      }),
    };
  }

  const { web3Accounts, web3Enable, web3FromSource } = await import(
    "@polkadot/extension-dapp"
  );
  return { web3Accounts, web3Enable, web3FromSource };
};

export async function connectWallet(
  appName: string = "Avail Explorer"
): Promise<InjectedExtension[]> {
  if (!isBrowser) {
    throw new Error("Cannot connect wallet in server-side environment");
  }

  try {
    extensions = [];
    extensionsInitialized = {};

    const { web3Enable } = await getPolkadotExtension();

    if (!window.injectedWeb3) {
      throw new Error("No wallet extension found");
    }

    // Search for the SubWallet extension
    const availableExtensions = Object.entries(window.injectedWeb3);
    const subwalletExtension = availableExtensions.find(([name]) =>
      name.toLowerCase().includes("subwallet")
    );

    if (!subwalletExtension) {
      throw new Error("SubWallet not found");
    }

    const [extensionName] = subwalletExtension;

    const singleExtensionWeb3: Record<string, any> = {};
    singleExtensionWeb3[extensionName] = window.injectedWeb3[extensionName];

    const originalInjectedWeb3 = window.injectedWeb3;

    window.injectedWeb3 = singleExtensionWeb3;

    try {
      // Enable only the SubWallet extension
      const enabledExtensions = await web3Enable(appName);

      if (enabledExtensions.length > 0) {
        extensions = enabledExtensions;
        return enabledExtensions;
      }

      throw new Error("Could not connect to SubWallet");
    } finally {
      window.injectedWeb3 = originalInjectedWeb3;
    }
  } catch (error) {
    console.error("Failed to connect wallet:", error);
    throw error;
  }
}

/**
 * Get accounts from connected wallet
 */
export async function getAccounts() {
  if (!isBrowser) {
    return [];
  }

  try {
    const { web3Accounts } = await getPolkadotExtension();
    // Don't attempt to force-connect if no extensions are available
    // Just return any available accounts without prompting
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
    const accountInfo = await api.query.system.account(address);

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
  if (!isBrowser) {
    throw new Error("Cannot submit data in server-side environment");
  }

  let api = await getAvailApi();
  const { web3Accounts, web3FromSource } = await getPolkadotExtension();

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
      await injector.metadata.provide(metadata as any);
      extensionsInitialized[injector.name] = true;
      console.log(`Extension ${injector.name} metadata initialized`);
    }

    // Create and send the transaction
    const tx = api.tx.dataAvailability.submitData(data);

    // Get the transaction hash as hex string for explorer link
    const initialTxHash = tx.hash.toHex();

    return new Promise((resolve, reject) => {
      let resolved = false;
      let timeout = setTimeout(() => {
        if (!resolved) {
          console.log("Data submission taking longer than expected...");
        }
      }, 30000); // 30 seconds timeout warning

      tx.signAndSend(
        address,
        {
          signer: injector.signer,
          app_id: 328,
        } as any,
        ({ status, isError, events, dispatchError, txHash: signedTxHash }) => {
          // Get the final txHash from the signAndSend callback
          const finalTxHash = signedTxHash
            ? signedTxHash.toString()
            : initialTxHash;

          if (dispatchError) {
            const errorInfo = dispatchError.isModule
              ? api.registry.findMetaError(dispatchError.asModule)
              : {
                  section: "unknown",
                  name: "unknown",
                  docs: [dispatchError.toString()],
                };

            clearTimeout(timeout);
            resolved = true;

            resolve({
              success: false,
              error: `${errorInfo.section}.${
                errorInfo.name
              }: ${errorInfo.docs.join(" ")}`,
              blockHash: status?.isInBlock
                ? status.asInBlock.toString()
                : status?.isFinalized
                ? status.asFinalized.toString()
                : null,
              extrinsicId: null,
              txHash: finalTxHash,
            });
            return;
          }

          if (isError) {
            console.error("Transaction error:", events);
            clearTimeout(timeout);
            resolved = true;
            reject(new Error("Transaction failed"));
            return;
          }

          // Check all possible status conditions
          if (status) {
            if (status.isInvalid) console.log("Transaction status: Invalid");
            if (status.isBroadcast)
              console.log("Transaction status: Broadcast");

            if (status.isInBlock) {
              const blockHash = status.asInBlock.toString();

              // Find the extrinsic index from the block hash and return as extrinsicId
              const extrinsicIndex = extractExtrinsicIndex(events);
              const extrinsicId = extrinsicIndex
                ? `${blockHash}-${extrinsicIndex}`
                : null;

              clearTimeout(timeout);
              resolved = true;
              resolve({
                success: true,
                blockHash: blockHash,
                status: "inBlock",
                extrinsicId,
                txHash: finalTxHash,
              });
            }

            if (status.isFinalized) {
              const blockHash = status.asFinalized.toString();

              // Find the extrinsic index from the block hash and return as extrinsicId
              const extrinsicIndex = extractExtrinsicIndex(events);
              const extrinsicId = extrinsicIndex
                ? `${blockHash}-${extrinsicIndex}`
                : null;

              clearTimeout(timeout);
              resolved = true;
              resolve({
                success: true,
                blockHash: blockHash,
                status: "finalized",
                extrinsicId,
                txHash: finalTxHash,
              });
            }
          }
        }
      ).catch((error) => {
        console.error("SignAndSend error:", error);
        clearTimeout(timeout);
        resolved = true;
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
  if (!isBrowser) {
    throw new Error("Cannot transfer tokens in server-side environment");
  }

  let api = await getAvailApi();
  const { web3Accounts, web3FromSource } = await getPolkadotExtension();

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

    // Get the transaction hash as hex string for explorer link
    const initialTxHash = tx.hash.toHex();

    return new Promise((resolve, reject) => {
      let resolved = false;
      let timeout = setTimeout(() => {
        if (!resolved) {
          console.log("Transaction taking longer than expected...");
        }
      }, 30000); // 30 seconds timeout warning

      tx.signAndSend(
        fromAddress,
        {
          signer: injector.signer,
        },
        async ({
          status,
          dispatchError,
          events,
          txHash: signedTxHash,
          dispatchInfo,
          txIndex,
        }) => {
          // Get the final txHash from the signAndSend callback
          const finalTxHash = signedTxHash
            ? signedTxHash.toString()
            : initialTxHash;

          // Handle dispatch errors
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(
                dispatchError.asModule
              );
              const { docs, name, section } = decoded;
              clearTimeout(timeout);
              resolved = true;

              resolve({
                success: false,
                error: `${section}.${name}: ${docs.join(" ")}`,
                blockHash: status?.isInBlock
                  ? status.asInBlock.toString()
                  : status?.isFinalized
                  ? status.asFinalized.toString()
                  : null,
                txHash: finalTxHash,
              });
            } else {
              // Handle other errors
              clearTimeout(timeout);
              resolved = true;

              resolve({
                success: false,
                error: dispatchError.toString(),
                blockHash: status?.isInBlock
                  ? status.asInBlock.toString()
                  : status?.isFinalized
                  ? status.asFinalized.toString()
                  : null,
                txHash: finalTxHash,
              });
            }
            return;
          }

          if (status.isInBlock || status.isFinalized) {
            const blockHash = status.isFinalized
              ? status.asFinalized.toString()
              : status.asInBlock.toString();

            const transferEvent = events.find(
              ({ event }) =>
                event.section === "balances" && event.method === "Transfer"
            );

            if (transferEvent) {
              clearTimeout(timeout);
              resolved = true;

              // Find the extrinsic index from the block hash and return as extrinsicId
              const extrinsicIndex = extractExtrinsicIndex(events);
              const extrinsicId = extrinsicIndex
                ? `${blockHash}-${extrinsicIndex}`
                : null;

              resolve({
                success: true,
                blockHash: blockHash,
                status: status.isFinalized ? "finalized" : "inBlock",
                events: events.map(({ event }) => ({
                  method: event.method,
                  section: event.section,
                  data: event.data.toHuman(),
                })),
                extrinsicId,
                txHash: finalTxHash,
              });
            } else {
              clearTimeout(timeout);
              resolved = true;

              // Find the extrinsic index from the block hash and return as extrinsicId
              const extrinsicIndex = extractExtrinsicIndex(events);
              const extrinsicId = extrinsicIndex
                ? `${blockHash}-${extrinsicIndex}`
                : null;

              resolve({
                success: true,
                blockHash: blockHash,
                status: status.isFinalized ? "finalized" : "inBlock",
                warning: "No transfer event found in transaction",
                extrinsicId,
                txHash: finalTxHash,
              });
            }
          }

          if (status.isBroadcast) {
            if (!resolved) {
              setTimeout(() => {
                if (!resolved) {
                  clearTimeout(timeout);
                  resolved = true;
                  resolve({
                    success: true,
                    blockHash: null,
                    status: "pending",
                    txHash: finalTxHash,
                  });
                }
              }, 3000); // Wait 3 seconds after broadcast to return an initial status
            }
          }
        }
      ).catch((error) => {
        console.error("SignAndSend error:", error);
        clearTimeout(timeout);
        resolved = true;
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

/**
 * Tries to silently reconnect to a wallet that has already authorized the application
 */
export async function silentReconnect(
  appName: string = "Avail Explorer"
): Promise<boolean> {
  if (!isBrowser) {
    return false;
  }

  try {
    // Reset extensions state
    extensions = [];
    extensionsInitialized = {};

    if (!window.injectedWeb3) {
      return false;
    }

    // Check if SubWallet is available
    const availableExtensions = Object.entries(window.injectedWeb3);
    const subwalletExtension = availableExtensions.find(([name]) =>
      name.toLowerCase().includes("subwallet")
    );

    if (!subwalletExtension) {
      return false;
    }

    // Try to reconnect
    const enabledExtensions = await connectWallet(appName);

    if (enabledExtensions.length > 0) {
      const { web3Accounts } = await getPolkadotExtension();
      const accounts = await web3Accounts();

      if (accounts.length > 0) {
        console.log(`Reconnected successfully to ${accounts.length} accounts`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Silent reconnection failed:", error);
    return false;
  }
}

/**
 * Extract the extrinsic index from transaction events
 * This function looks for the extrinsic index within the transaction events
 * @param events The events from the transaction
 * @returns The extrinsic index as a string or null if not found
 */
function extractExtrinsicIndex(events: any[]) {
  if (!events || events.length === 0) return null;

  // Look through the events to find the extrinsic index from the phase
  for (const eventRecord of events) {
    // Check if the event has a phase and if it's ApplyExtrinsic
    if (eventRecord.phase && eventRecord.phase.isApplyExtrinsic) {
      return eventRecord.phase.asApplyExtrinsic.toString();
    }
  }

  for (const eventRecord of events) {
    if (eventRecord.phase) {
      return "1";
    }
  }

  return "1";
}

/**
 * Disconnects the wallet and clears local storage
 */
export async function disconnectWallet(): Promise<void> {
  if (!isBrowser) {
    return;
  }

  try {
    extensions = [];
    extensionsInitialized = {};

    localStorage.removeItem("last-connected-wallet");
    localStorage.removeItem("wallet-storage");
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
    throw error;
  }
}
