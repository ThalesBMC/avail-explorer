import { StatusCard } from "./StatusCard";
import { StatusCardsGroupProps } from "@/types/ui";

export const StatusCardsGroup = ({ isConnected }: StatusCardsGroupProps) => {
  return (
    <div className="flex gap-3">
      <StatusCard
        title="Indexer"
        status={isConnected.indexer ? "Operational" : "Offline"}
        isActive={isConnected.indexer}
      />
      <StatusCard
        title="RPC"
        status={isConnected.rpc ? "Connected" : "Disconnected"}
        isActive={isConnected.rpc}
      />
      <StatusCard
        title="Network"
        status={isConnected.internet ? "Online" : "Offline"}
        isActive={isConnected.internet}
      />
    </div>
  );
};
