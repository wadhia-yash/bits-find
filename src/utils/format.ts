import { ItemStatus } from '../types';
import { colors } from '../theme';

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMin = Math.round((Date.now() - then) / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;

  const hours = Math.round(diffMin / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

export function fullDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const STATUS_META: Record<
  ItemStatus,
  { label: string; fg: string; bg: string }
> = {
  OPEN: { label: 'Open', fg: colors.blue, bg: colors.blueSoft },
  CLAIM_PENDING: { label: 'Claim pending', fg: colors.amber, bg: colors.amberSoft },
  RETURNED: { label: 'Returned', fg: colors.green, bg: colors.greenSoft },
};

/** Initials for the avatar chip on a request card. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
