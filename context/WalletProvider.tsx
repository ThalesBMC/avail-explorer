import { FC, ReactNode, useEffect } from "react";
import { useWalletStore } from "@/stores/WalletStore";
import dynamic from "next/dynamic";
import { isConnected } from "avail-js-sdk";

interface WalletProviderProps {
  children: ReactNode;
}

const WalletProviderClient: FC<WalletProviderProps> = ({ children }) => {
  const { accounts, selectedAccount, setAccounts, setSelectedAccount } =
    useWalletStore();

  useEffect(() => {
    const initWallet = async () => {
      try {
        const { connectWallet, getAccounts } = await import(
          "@/api/avail-client"
        );

        // Only attempt to reconnect if there was a previous connection
        if (isConnected()) {
          // Initialize web3Enable with app name
          await connectWallet("Avail Explorer");

          // Get accounts after enabling the extension
          const walletAccounts = await getAccounts();

          if (walletAccounts.length > 0) {
            setAccounts(walletAccounts);

            // If the previously selected account no longer exists in the wallet,
            // select the first available account instead
            if (
              selectedAccount &&
              !walletAccounts.some((acc) => acc.address === selectedAccount)
            ) {
              setSelectedAccount(walletAccounts[0].address);
            }
          }
        }
      } catch (error) {
        console.error("Failed to initialize wallet:", error);
      }
    };

    if (typeof window !== "undefined") {
      initWallet();
    }
  }, [accounts, selectedAccount, setAccounts, setSelectedAccount]);

  return <>{children}</>;
};

// Export a dynamic component with ssr disabled
export const WalletProvider = dynamic(
  () => Promise.resolve(WalletProviderClient),
  {
    ssr: false,
  }
) as FC<WalletProviderProps>;
