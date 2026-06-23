export function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "1 day ago";
  if (diffDay < 30) return `${diffDay} days ago`;
  return date.toLocaleDateString();
}

export function isNew(date: Date): boolean {
  const diffHr = (new Date().getTime() - date.getTime()) / (1000 * 60 * 60);
  return diffHr <= 6;
}
