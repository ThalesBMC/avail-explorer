import { FC, useState } from "react";
import { ChevronDown } from "lucide-react";

interface ActionSelectorProps {
  activeAction: "transfer" | "data";
  setActiveAction: (action: "transfer" | "data") => void;
}

export const ActionSelector: FC<ActionSelectorProps> = ({
  activeAction,
  setActiveAction,
}) => {
  const [showActionDropdown, setShowActionDropdown] = useState(false);

  const handleActionChange = (action: "transfer" | "data") => {
    setActiveAction(action);
    setShowActionDropdown(false);
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Action Type
      </label>
      <div className="relative">
        <button
          onClick={() => setShowActionDropdown(!showActionDropdown)}
          className="flex items-center justify-between w-full p-2 border border-gray-300 rounded-md bg-white font-medium"
        >
          <span>
            {activeAction === "transfer" ? "Transfer Tokens" : "Submit Data"}
          </span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </button>

        {showActionDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            <button
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                activeAction === "transfer"
                  ? "bg-purple-50 text-primary-dark"
                  : ""
              }`}
              onClick={() => handleActionChange("transfer")}
            >
              Transfer Tokens
            </button>
            <button
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                activeAction === "data" ? "bg-purple-50 text-primary-dark" : ""
              }`}
              onClick={() => {
                setActiveAction("data");
                setShowActionDropdown(false);
              }}
            >
              Submit Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
