import { FC, ReactNode, useEffect } from "react";
import { useWalletStore } from "@/stores/WalletStore";
import dynamic from "next/dynamic";

interface WalletProviderProps {
  children: ReactNode;
}

const WalletProviderClient: FC<WalletProviderProps> = ({ children }) => {
  const { setAccounts, setSelectedAccount } = useWalletStore();

  useEffect(() => {
    const initWallet = async () => {
      try {
        const { connectWallet, getAccounts } = await import(
          "@/api/avail-client"
        );
      } catch (error) {
        console.error("Failed to initialize wallet:", error);
      }
    };

    if (typeof window !== "undefined") {
      initWallet();
    }
  }, [setAccounts, setSelectedAccount]);

  return <>{children}</>;
};

// Export a dynamic component with ssr disabled
export const WalletProvider = dynamic(
  () => Promise.resolve(WalletProviderClient),
  {
    ssr: false,
  }
) as FC<WalletProviderProps>;
