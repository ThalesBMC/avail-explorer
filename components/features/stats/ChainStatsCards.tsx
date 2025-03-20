import { useChainStats } from "@/hooks/useAvailData";
import { formatBytes } from "@/utils";
import { StatCard } from "./StatCard";
import { useMemo } from "react";

export function ChainStatsCards() {
  const { data: stats, isLoading, error } = useChainStats();

  const statsItems = useMemo(
    () => [
      {
        title: "Total Blocks",
        value: stats?.blocks ?? 0,
      },
      {
        title: "Total Supply",
        value: stats?.totalIssuance ?? "0",
        isText: true,
        suffix: "AVAIL",
      },
      {
        title: "Active Validators",
        value: stats?.validators ?? 0,
      },
      {
        title: "Block Time",
        value: stats?.blockTime ?? 6,
        suffix: "s",
      },
      {
        title: "Last 24h Blob Size",
        value: stats?.blobSize24h
          ? formatBytes(stats.blobSize24h.totalSize.toString())
          : "0 Bytes",
        isText: true,
      },
      {
        title: "24h Submissions",
        value: stats?.blobSize24h?.submissionCount ?? 0,
      },
      {
        title: "Latest Block",
        value: stats?.blocks ?? 0,
      },
      {
        title: "Finalized Block",
        value: stats?.blocks ?? 0,
      },
    ],
    [stats]
  );

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statsItems.map((item, index) => (
          <StatCard
            key={index}
            title={item.title}
            value={item.value}
            isLoading={isLoading}
            error={error}
            isText={item.isText}
            suffix={item.suffix}
          />
        ))}
      </div>
    </div>
  );
}
