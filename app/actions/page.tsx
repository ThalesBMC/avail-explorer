"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SubstrateWalletConnection } from "@/components/SubstrateWalletConnection";
import { useWalletStore } from "@/stores/WalletStore";
import { useBalance } from "@/hooks/useBalance";
import { useTransactionStore } from "@/stores/TransactionStore";
import { TransferForm } from "@/components/features/actions/TransferForm";
import { DataForm } from "@/components/features/actions/DataForm";

import { ActionSelector } from "@/components/features/actions/ActionSelector";
import { TransactionHistory } from "@/components/features/actions/TransactionHistory";
import { StatusBadge } from "@/components/StatusBadge";

export default function ActionsPage() {
  const { selectedAccount } = useWalletStore();
  const { balance } = useBalance();
  const { transactions } = useTransactionStore();
  const [activeAction, setActiveAction] = useState<"transfer" | "data">(
    "transfer"
  );
  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [txMessage, setTxMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleStatusChange = useCallback(
    (status: "idle" | "pending" | "success" | "error", message: string) => {
      setTxStatus(status);
      setTxMessage(message);
    },
    []
  );

  const resetStatus = useCallback(() => {
    setTxStatus("idle");
    setTxMessage("");
  }, []);

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center mb-6">
        <Link
          href="/"
          className="flex items-center text-primary hover:text-primary-dark mr-4"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Back</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Actions</h1>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-primary-dark">
            Perform Actions
          </h2>
          <SubstrateWalletConnection />
        </div>

        {selectedAccount ? (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-500">Your Balance</p>
              <p className="text-xl font-medium">
                {balance ? `${balance.free} AVAIL` : "Loading..."}
              </p>
            </div>

            <ActionSelector
              activeAction={activeAction}
              setActiveAction={setActiveAction}
            />

            {activeAction === "transfer" ? (
              <TransferForm onStatusChange={handleStatusChange} />
            ) : (
              <DataForm onStatusChange={handleStatusChange} />
            )}

            <StatusBadge
              status={txStatus}
              message={txMessage}
              onReset={resetStatus}
            />
          </>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-500 mb-4">
              Connect your wallet to perform actions on the Avail network.
            </p>
            <p className="text-sm text-gray-400">
              Use the &quot;Connect Wallet&quot; button in the top right corner.
            </p>
          </div>
        )}
      </div>

      <TransactionHistory
        transactions={transactions}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
}
