import { FC, ReactNode, useEffect, useState, useCallback } from "react";
import { useWalletStore } from "@/stores/WalletStore";
import dynamic from "next/dynamic";
import { WalletStatus } from "@/stores/WalletStore";

interface WalletProviderProps {
  children: ReactNode;
}

const WalletProviderClient: FC<WalletProviderProps> = ({ children }) => {
  const {
    accounts,
    selectedAccount,
    setAccounts,
    setSelectedAccount,
    setStatus,
    setLastConnectedWallet,
    status,
    lastConnectedWallet,
  } = useWalletStore();
  const [initialized, setInitialized] = useState(false);

  const handleDisconnect = useCallback(async () => {
    try {
      const { disconnectWallet } = await import("@/api/avail-client");

      setSelectedAccount(null);
      setAccounts([]);
      setStatus(WalletStatus.DISCONNECTED);
      setLastConnectedWallet(null);
      setInitialized(false);

      localStorage.removeItem("wallet-storage");
      localStorage.removeItem("last-connected-wallet");

      await disconnectWallet();
    } catch (error) {
      setStatus(WalletStatus.DISCONNECTED);
      setInitialized(false);
    }
  }, [setSelectedAccount, setAccounts, setStatus, setLastConnectedWallet]);

  useEffect(() => {
    const handleExternalDisconnect = () => {
      handleDisconnect();
    };
    window.addEventListener("wallet-disconnect", handleExternalDisconnect);

    return () => {
      window.removeEventListener("wallet-disconnect", handleExternalDisconnect);
    };
  }, [handleDisconnect]);

  useEffect(() => {
    const initWallet = async () => {
      if (
        status === WalletStatus.CONNECTING ||
        status === WalletStatus.DISCONNECTING ||
        initialized
      ) {
        return;
      }

      try {
        setStatus(WalletStatus.CONNECTING);

        const { silentReconnect, getAccounts } = await import(
          "@/api/avail-client"
        );

        const storedWalletId = localStorage.getItem("last-connected-wallet");

        if (storedWalletId) {
          setLastConnectedWallet(storedWalletId);

          try {
            const reconnected = await silentReconnect("Avail Explorer");

            if (reconnected) {
              const walletAccounts = await getAccounts();

              if (walletAccounts.length > 0) {
                setAccounts(walletAccounts);
                setSelectedAccount(walletAccounts[0].address);
                setStatus(WalletStatus.CONNECTED);

                const { web3AccountsSubscribe } = await import(
                  "@polkadot/extension-dapp"
                );

                let unsubFn: (() => void) | undefined;

                web3AccountsSubscribe((injectedAccounts) => {
                  if (injectedAccounts.length > 0) {
                    setAccounts(injectedAccounts);

                    if (
                      selectedAccount &&
                      !injectedAccounts.some(
                        (acc) => acc.address === selectedAccount
                      )
                    ) {
                      setSelectedAccount(injectedAccounts[0].address);
                    }
                  } else if (
                    injectedAccounts.length === 0 &&
                    accounts.length > 0
                  ) {
                    handleDisconnect();
                  }
                }).then((unsub) => {
                  unsubFn = unsub;
                });

                setInitialized(true);

                return () => {
                  if (unsubFn) unsubFn();
                };
              }
            }

            await handleDisconnect();
          } catch (error) {
            await handleDisconnect();
          }
        } else {
          setStatus(WalletStatus.DISCONNECTED);
        }

        setInitialized(true);
      } catch (error) {
        await handleDisconnect();
      }
    };

    if (typeof window !== "undefined" && !initialized) {
      initWallet();
    }
  }, [
    accounts,
    selectedAccount,
    setAccounts,
    setSelectedAccount,
    setStatus,
    setLastConnectedWallet,
    initialized,
    status,
    lastConnectedWallet,
    handleDisconnect,
  ]);

  return <>{children}</>;
};

export const WalletProvider = dynamic(
  () => Promise.resolve(WalletProviderClient),
  {
    ssr: false,
  }
) as FC<WalletProviderProps>;
