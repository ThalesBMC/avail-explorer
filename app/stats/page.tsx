"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ChainStatsCards } from "@/components/features/stats/ChainStatsCards";
import { StatusCardsGroup } from "@/components/StatusCardGroup";
import { TransactionsPaginated } from "@/components/features/transactions/TransactionsPaginated";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import Image from "next/image";
export default function BlocksPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const isConnected = useConnectionStatus();

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex flex-col items-center justify-center mb-8">
        <Image
          src="/images/avail_logo.jpeg"
          alt="Avail Logo"
          width={64}
          height={64}
          className="rounded-full"
        />
        <h1 className="text-3xl font-bold mt-2">Avail Explorer</h1>
      </div>

      <div className="flex items-center mb-6">
        <Link
          href="/"
          className="flex items-center text-primary hover:text-primary-dark mr-4"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Back</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Network Statistics</h1>
      </div>

      <ChainStatsCards />

      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Recent Transactions
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <TransactionsPaginated
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <StatusCardsGroup isConnected={isConnected} />
      </div>
    </div>
  );
}
