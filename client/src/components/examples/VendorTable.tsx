import { VendorTable } from '../VendorTable';

const mockVendors = [
  {
    id: "1",
    name: "Acme Packaging Inc.",
    category: "Packaging",
    riskLevel: "low" as const,
    compliancePercentage: 95,
    status: "active" as const,
  },
  {
    id: "2",
    name: "GlobalTech Logistics",
    category: "Logistics",
    riskLevel: "medium" as const,
    compliancePercentage: 67,
    status: "active" as const,
  },
  {
    id: "3",
    name: "Premier Raw Materials Ltd.",
    category: "Raw Material",
    riskLevel: "high" as const,
    compliancePercentage: 42,
    status: "active" as const,
  },
  {
    id: "4",
    name: "SafetyFirst Consultants",
    category: "Services",
    riskLevel: "low" as const,
    compliancePercentage: 88,
    status: "onboarding" as const,
  },
  {
    id: "5",
    name: "EcoComponents Supplier",
    category: "Component Supplier",
    riskLevel: "medium" as const,
    compliancePercentage: 73,
    status: "active" as const,
  },
];

export default function VendorTableExample() {
  return (
    <VendorTable
      vendors={mockVendors}
      onViewVendor={(id) => console.log('View vendor:', id)}
      onEditVendor={(id) => console.log('Edit vendor:', id)}
      onArchiveVendor={(id) => console.log('Archive vendor:', id)}
    />
  );
}
