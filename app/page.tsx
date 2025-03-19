import { ChainStats } from "@/components/chain-stats";
import { ActionPanel } from "@/components/action-panel";
import { LatestBlocks } from "@/components/latest-blocks";
import { LatestTransactions } from "@/components/latest-transactions";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Avail Explorer</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/actions"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center"
        >
          <h2 className="text-xl font-semibold mb-2">Actions</h2>
          <p className="text-gray-600">View and manage available actions</p>
        </Link>

        <Link
          href="/stats"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center"
        >
          <h2 className="text-xl font-semibold mb-2">Statistics</h2>
          <p className="text-gray-600">
            View network statistics and performance
          </p>
        </Link>
      </div>
    </div>
  );
}
