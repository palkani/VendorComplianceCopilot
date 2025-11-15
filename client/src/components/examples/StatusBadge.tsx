import { StatusBadge } from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="approved" />
      <StatusBadge status="pending" />
      <StatusBadge status="expired" />
      <StatusBadge status="rejected" />
      <StatusBadge status="missing" />
    </div>
  );
}
