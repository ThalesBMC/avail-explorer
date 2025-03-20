import { StatCardProps } from "@/types/stats";
import { formatNumber } from "@/utils";

export function StatCard({
  title,
  value,
  isLoading,
  error,
  isText,
  suffix,
}: StatCardProps) {
  return (
    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p
        className={`text-2xl truncate font-bold text-primary-dark ${
          isLoading ? "animate-pulse" : ""
        }`}
      >
        {isLoading
          ? "Loading..."
          : error
          ? "Error"
          : isText
          ? value
          : `${formatNumber(value)}${suffix ? ` ${suffix}` : ""}`}
      </p>
    </div>
  );
}
