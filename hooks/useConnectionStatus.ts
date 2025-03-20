import { useState, useEffect, useCallback, useRef } from "react";
import { getAvailApi } from "@/api/avail-client";
import { ConnectionStatus } from "@/types/wallet";
import { fetchGraphQLData } from "@/api/graphql";

/**
 * Hook that monitors connection status to critical services:
 * - Internet connectivity (using navigator.onLine)
 * - RPC node connection
 * - Indexer service connection
 *
 * @returns Current connection status for all services
 */
export function useConnectionStatus(): ConnectionStatus {
  const [isConnected, setIsConnected] = useState<ConnectionStatus>({
    rpc: false,
    indexer: false,
    internet: navigator.onLine,
  });

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef<{
    rpc: boolean;
    indexer: boolean;
  }>({
    rpc: false,
    indexer: false,
  });

  /**
   * Check connection to Avail RPC node
   */
  const checkRpcConnection = useCallback(async (): Promise<void> => {
    if (isCheckingRef.current.rpc) return;
    isCheckingRef.current.rpc = true;

    try {
      await getAvailApi();
      setIsConnected((prev) => ({ ...prev, rpc: true }));
    } catch (error) {
      console.error("RPC connection failed:", error);
      setIsConnected((prev) => ({ ...prev, rpc: false }));
    } finally {
      isCheckingRef.current.rpc = false;
    }
  }, []);

  /**
   * Check connection to Avail Indexer service
   */
  const checkIndexerConnection = useCallback(async (): Promise<void> => {
    if (isCheckingRef.current.indexer) return;
    isCheckingRef.current.indexer = true;

    try {
      await fetchGraphQLData(`
        query TestConnection {
          _metadata {
            lastProcessedHeight
          }
        }
      `);
      setIsConnected((prev) => ({ ...prev, indexer: true }));
    } catch (error) {
      console.error("Indexer connection failed:", error);
      setIsConnected((prev) => ({ ...prev, indexer: false }));
    } finally {
      isCheckingRef.current.indexer = false;
    }
  }, []);

  /**
   * Update the internet connection status based on navigator.onLine
   */
  const updateInternetStatus = useCallback((): void => {
    setIsConnected((prev) => ({
      ...prev,
      internet: navigator.onLine,
    }));
  }, []);

  /**
   * Run all connection checks
   */
  const checkAllConnections = useCallback((): void => {
    updateInternetStatus();

    // Only check services if internet is available
    if (navigator.onLine) {
      checkRpcConnection();
      checkIndexerConnection();
    }
  }, [updateInternetStatus, checkRpcConnection, checkIndexerConnection]);

  useEffect(() => {
    const handleOnline = (): void => {
      setIsConnected((prev) => ({ ...prev, internet: true }));
      // When coming back online, check other services
      checkRpcConnection();
      checkIndexerConnection();
    };

    const handleOffline = (): void =>
      setIsConnected((prev) => ({ ...prev, internet: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkRpcConnection, checkIndexerConnection]);

  useEffect(() => {
    checkAllConnections();

    // Setup interval for periodic checks (every 20 seconds)
    checkIntervalRef.current = setInterval(checkAllConnections, 20000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkAllConnections]);

  return isConnected;
}
