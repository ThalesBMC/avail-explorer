export function formatBytes(bytes: string) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === "0") return "0 Bytes";
  const i = Math.floor(Math.log(Number(bytes)) / Math.log(1024));
  return `${(Number(bytes) / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}
