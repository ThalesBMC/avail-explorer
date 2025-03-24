"use client";

import { useState, useCallback } from "react";
import {
  connectWallet,
  getAccounts,
  disconnectWallet,
} from "@/api/avail-client";
import { Button } from "@/components/ui/button";
import { truncateHash } from "@/utils";
import { useWalletStore } from "@/stores/WalletStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WalletStatus } from "@/stores/WalletStore";

// Available wallet extensions
const WALLET_EXTENSIONS = [
  { id: "subwallet-js", name: "SubWallet", logo: "🔵" },
];

export function SubstrateWalletConnection() {
  const {
    selectedAccount,
    accounts,
    setSelectedAccount,
    setAccounts,
    setStatus,
    lastConnectedWallet,
    setLastConnectedWallet,
  } = useWalletStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWalletListOpen, setIsWalletListOpen] = useState(false);

  const handleConnect = useCallback(
    async (walletId?: string) => {
      if (!walletId) return;

      setIsConnecting(true);
      setError(null);
      setIsWalletListOpen(false);
      setStatus(WalletStatus.CONNECTING);

      try {
        if (lastConnectedWallet && lastConnectedWallet !== walletId) {
          await disconnectWallet();
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        localStorage.setItem("last-connected-wallet", walletId);
        setLastConnectedWallet(walletId);

        const walletName =
          WALLET_EXTENSIONS.find((w) => w.id === walletId)?.name || walletId;

        const connectedExtensions = await connectWallet(
          `Avail Explorer via ${walletName}`
        );

        if (connectedExtensions.length === 0) {
          throw new Error(`Could not connect to ${walletName}`);
        }

        const walletAccounts = await getAccounts();

        if (walletAccounts.length > 0) {
          setAccounts(walletAccounts);
          setSelectedAccount(walletAccounts[0].address);
          setStatus(WalletStatus.CONNECTED);
        } else {
          throw new Error("No Account found");
        }
      } catch (err: Error | unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to connect wallet. Make sure you have the extension installed and enabled."
        );
        localStorage.removeItem("last-connected-wallet");
        setLastConnectedWallet(null);
        setStatus(WalletStatus.DISCONNECTED);
      } finally {
        setIsConnecting(false);
      }
    },
    [
      setAccounts,
      setSelectedAccount,
      setStatus,
      setLastConnectedWallet,
      lastConnectedWallet,
    ]
  );

  const handleAccountChange = useCallback(
    (address: string) => {
      setSelectedAccount(address);
    },
    [setSelectedAccount]
  );

  const handleDisconnect = async () => {
    try {
      setStatus(WalletStatus.DISCONNECTING);
      setSelectedAccount(null);
      setAccounts([]);
      setLastConnectedWallet(null);
      await disconnectWallet();
      setStatus(WalletStatus.DISCONNECTED);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      setStatus(WalletStatus.DISCONNECTED);
    }
  };

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
        <Dialog open={isWalletListOpen} onOpenChange={setIsWalletListOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setIsWalletListOpen(true)}
              disabled={isConnecting}
              variant="default"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect your wallet</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col space-y-3 py-4">
              {WALLET_EXTENSIONS.map((wallet) => (
                <Button
                  key={wallet.id}
                  variant="outline"
                  className={`justify-start text-left font-normal ${
                    lastConnectedWallet === wallet.id
                      ? "border-primary bg-primary/10"
                      : ""
                  }`}
                  disabled={isConnecting}
                  onClick={() => handleConnect(wallet.id)}
                >
                  <span className="mr-2">{wallet.logo}</span>
                  <span className="flex-1">{wallet.name}</span>
                  {lastConnectedWallet === wallet.id && (
                    <span className="ml-auto text-xs text-primary px-2 py-1 rounded-full bg-primary/10">
                      Last used
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
