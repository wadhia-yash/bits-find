import { HANDOVER_LABEL, HandoverBadgeProps, STATUS_LABEL, StatusBadgeProps } from '../types';

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{STATUS_LABEL[status]}</span>;
}

export function HandoverBadge({ status }: HandoverBadgeProps) {
  return <span className={`badge badge-h-${status.toLowerCase()}`}>{HANDOVER_LABEL[status]}</span>;
}
