/**
 * Format a number with commas
 * @param num - Number or string to format
 * @returns Formatted number string
 * @throws {Error} If the input cannot be converted to a number
 */
export function formatNumber(num: number | string): string {
  const parsedNum = Number(num);
  if (isNaN(parsedNum)) {
    throw new Error("Invalid number format");
  }
  return new Intl.NumberFormat().format(parsedNum);
}
