import { StatCard } from '../StatCard';
import { CheckCircle, AlertTriangle, Clock, Building2 } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Overall Compliance"
        value="78%"
        icon={CheckCircle}
        trend={{ value: 5.2, isPositive: true }}
      />
      <StatCard
        title="Vendors at Risk"
        value="12"
        icon={AlertTriangle}
        trend={{ value: 3, isPositive: false }}
      />
      <StatCard
        title="Expiring This Month"
        value="24"
        icon={Clock}
      />
      <StatCard
        title="Total Vendors"
        value="156"
        icon={Building2}
        trend={{ value: 8.1, isPositive: true }}
      />
    </div>
  );
}
