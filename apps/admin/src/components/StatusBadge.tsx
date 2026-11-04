import { HANDOVER_LABEL, HandoverStatus, ItemStatus, STATUS_LABEL } from '../types';

export function StatusBadge({ status }: { status: ItemStatus }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{STATUS_LABEL[status]}</span>;
}

export function HandoverBadge({ status }: { status: HandoverStatus }) {
  return <span className={`badge badge-h-${status.toLowerCase()}`}>{HANDOVER_LABEL[status]}</span>;
}
