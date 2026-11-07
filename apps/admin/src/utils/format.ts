/** Hours as "14.5h", or "1d 6h" once it passes a day. */
export function formatHours(hours: number): string {
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const rest = Math.round(hours - days * 24);
  return `${days}d ${rest}h`;
}

/** "30 Sep" style date. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}
