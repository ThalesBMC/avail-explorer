import { StatusCardProps } from "@/types/ui";

export const StatusCard = ({ title, status, isActive }: StatusCardProps) => {
  return (
    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
      <div
        className={`h-2 w-2 rounded-full ${
          isActive ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <div className="text-sm">
        <span className="text-gray-500 mr-1">{title}:</span>
        <span className={isActive ? "text-green-700" : "text-red-700"}>
          {status}
        </span>
      </div>
    </div>
  );
};
