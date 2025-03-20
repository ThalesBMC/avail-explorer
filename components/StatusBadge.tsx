import { FC, useEffect } from "react";

interface StatusBadgeProps {
  status: "idle" | "pending" | "success" | "error";
  message: string;
  onReset?: () => void;
}

export const StatusBadge: FC<StatusBadgeProps> = ({
  status,
  message,
  onReset,
}) => {
  useEffect(() => {
    if (status !== "idle" && status !== "pending" && onReset) {
      const timer = setTimeout(() => {
        onReset();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [status, onReset]);

  if (status === "idle") return null;

  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
  };

  return (
    <div className={`p-3 rounded-md mt-4 ${colors[status]}`}>
      <p>{message}</p>
    </div>
  );
};
