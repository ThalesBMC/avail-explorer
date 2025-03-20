// Constants for date formatting
const DATE_FORMAT_OPTIONS = {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
} as const;

// Time intervals in seconds
const TIME_INTERVALS: Readonly<Record<TimeUnit, number>> = {
  year: 31536000,
  month: 2592000,
  week: 604800,
  day: 86400,
  hour: 3600,
  minute: 60,
  second: 1,
} as const;

// Types
type TimeUnit =
  | "year"
  | "month"
  | "week"
  | "day"
  | "hour"
  | "minute"
  | "second";

/**
 * Format a date string to a human-readable format
 * @param dateString - ISO date string or timestamp
 * @returns Formatted date string
 * @throws {Error} If the date string is invalid
 */
export function formatDate(dateString: string | number): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }

    return new Date(dateString).toLocaleString();
  } catch (error) {
    throw new Error(
      `Invalid date format: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
}

/**
 * Format a timestamp to a relative time string
 * @param timestamp - ISO date string or timestamp
 * @returns Relative time string (e.g., "5 minutes ago")
 * @throws {Error} If the timestamp is invalid
 */
export function formatRelativeTime(timestamp: string | number): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 30) {
      return "just now";
    }

    for (const [unit, secondsInUnit] of Object.entries(TIME_INTERVALS)) {
      const counter = Math.floor(seconds / secondsInUnit);
      if (counter > 0) {
        return `${counter} ${unit}${counter === 1 ? "" : "s"} ago`;
      }
    }

    return "just now";
  } catch (error) {
    throw new Error(
      `Invalid timestamp format: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
}
