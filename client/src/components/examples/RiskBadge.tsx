import { RiskBadge } from '../RiskBadge';

export default function RiskBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <RiskBadge level="low" />
      <RiskBadge level="medium" />
      <RiskBadge level="high" />
    </div>
  );
}
