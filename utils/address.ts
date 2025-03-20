/**
 * Formats an address to show first 4 and last 4 characters with ellipsis in between
 * @param address The address to format
 * @param chars Number of characters to show at start and end (default: 4)
 * @returns Formatted address string or "Unknown" if address is falsy
 */
export const formatAddress = (address?: string, chars: number = 4): string => {
  if (!address) return "Unknown";

  if (address.length <= chars * 2) return address;

  return `${address.substring(0, chars)}...${address.substring(
    address.length - chars
  )}`;
};

/**
 * Truncate an address or hash for display
 * @param hash - The hash or address to truncate
 * @param startLength - Number of characters to keep from the start
 * @param endLength - Number of characters to keep from the end
 * @returns Truncated string with ellipsis
 * @throws {Error} If the hash is invalid or lengths are invalid
 */
export function truncateHash(
  hash: string,
  startLength = 6,
  endLength = 4
): string {
  if (!hash) {
    throw new Error("Hash cannot be empty");
  }

  if (startLength < 0 || endLength < 0) {
    throw new Error("Length parameters must be non-negative");
  }

  if (startLength + endLength >= hash.length) {
    return hash;
  }

  return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`;
}
