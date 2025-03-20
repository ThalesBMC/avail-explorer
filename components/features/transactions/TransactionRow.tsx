import { formatRelativeTime, truncateHash } from "@/utils";
import { Transaction } from "@/types/graphql";

export const TransactionRow = ({
  transaction,
}: {
  transaction: Transaction;
}) => {
  const statusColor = transaction.success
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 max-w-[150px] truncate">
        <div className="text-primary-dark " title={transaction.argsName}>
          {transaction.argsName}
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 max-w-[120px] truncate">
        <span title={transaction.module}>{transaction.module}</span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="text-sm font-mono text-gray-600">
          {truncateHash(transaction.txHash)}
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span
          className="text-sm text-gray-500"
          title={new Date(transaction.timestamp).toLocaleString()}
        >
          {formatRelativeTime(transaction.timestamp)}
        </span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}
        >
          {transaction.success ? "Success" : "Failed"}
        </span>
      </td>
    </tr>
  );
};
