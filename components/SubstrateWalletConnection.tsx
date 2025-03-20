"use client";

import { useState, useCallback } from "react";
import { connectWallet, getAccounts } from "@/api/avail-client";
import { Button } from "@/components/ui/button";
import { truncateHash } from "@/utils";
import { useWalletStore } from "@/stores/WalletStore";

export function SubstrateWalletConnection() {
  const {
    selectedAccount,
    accounts,
    setSelectedAccount,
    setAccounts,
    disconnect,
  } = useWalletStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      await connectWallet("Avail Explorer");
      const walletAccounts = await getAccounts();
      setAccounts(walletAccounts);

      if (walletAccounts.length > 0) {
        setSelectedAccount(walletAccounts[0].address);
      }
    } catch (err: any) {
      console.error("Failed to connect wallet:", err);
      setError(
        err.message ||
          "Failed to connect wallet. Please make sure you have the Polkadot.js or SubWallet extension installed and enabled."
      );
    } finally {
      setIsConnecting(false);
    }
  }, [setAccounts, setSelectedAccount]);

  const handleAccountChange = useCallback(
    (address: string) => {
      setSelectedAccount(address);
    },
    [setSelectedAccount]
  );

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  return (
    <div>
      {selectedAccount ? (
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
            <select
              value={selectedAccount}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="text-sm font-medium bg-transparent border-none outline-none"
            >
              {accounts.map((account) => (
                <option key={account.address} value={account.address}>
                  {account.meta.name || truncateHash(account.address)}
                </option>
              ))}
            </select>
            <div className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Connected
            </div>
            <Button
              size="sm"
              onClick={handleDisconnect}
              className="ml-2 text-xs"
            >
              Disconnect
            </Button>
          </div>
          <span className="text-xs text-gray-500 mt-1">
            {truncateHash(selectedAccount, 10, 6)}
          </span>
        </div>
      ) : (
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          variant="default"
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      )}

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
