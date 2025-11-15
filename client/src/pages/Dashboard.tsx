import { StatCard } from "@/components/StatCard";
import { ComplianceChart } from "@/components/ComplianceChart";
import { ExpiringDocumentsTable } from "@/components/ExpiringDocumentsTable";
import { CheckCircle, AlertTriangle, Clock, Building2 } from "lucide-react";

const mockStats = {
  overallCompliance: 78,
  vendorsAtRisk: 12,
  expiringThisMonth: 24,
  totalVendors: 156,
};

const mockChartData = [
  { category: "Packaging", percentage: 82 },
  { category: "Logistics", percentage: 67 },
  { category: "Raw Material", percentage: 73 },
  { category: "Services", percentage: 91 },
  { category: "Components", percentage: 78 },
];

const mockExpiringDocs = [
  {
    id: "1",
    vendorName: "Acme Packaging Inc.",
    documentType: "ISO 9001 Certificate",
    expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    status: "approved" as const,
  },
  {
    id: "2",
    vendorName: "GlobalTech Logistics",
    documentType: "Insurance Policy",
    expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    status: "approved" as const,
  },
  {
    id: "3",
    vendorName: "Premier Raw Materials Ltd.",
    documentType: "Safety Certification",
    expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: "expired" as const,
  },
  {
    id: "4",
    vendorName: "SafetyFirst Consultants",
    documentType: "License",
    expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    status: "pending" as const,
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your vendor compliance status
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Overall Compliance"
          value={`${mockStats.overallCompliance}%`}
          icon={CheckCircle}
          trend={{ value: 5.2, isPositive: true }}
        />
        <StatCard
          title="Vendors at Risk"
          value={mockStats.vendorsAtRisk}
          icon={AlertTriangle}
          trend={{ value: 3, isPositive: false }}
        />
        <StatCard
          title="Expiring This Month"
          value={mockStats.expiringThisMonth}
          icon={Clock}
        />
        <StatCard
          title="Total Vendors"
          value={mockStats.totalVendors}
          icon={Building2}
          trend={{ value: 8.1, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ComplianceChart data={mockChartData} />
        <ExpiringDocumentsTable
          documents={mockExpiringDocs}
          onSendReminder={(id) => console.log('Send reminder for:', id)}
        />
      </div>
    </div>
  );
}
