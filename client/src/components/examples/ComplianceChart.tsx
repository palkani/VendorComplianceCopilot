import { ComplianceChart } from '../ComplianceChart';

const mockData = [
  { category: "Packaging", percentage: 82 },
  { category: "Logistics", percentage: 67 },
  { category: "Raw Material", percentage: 73 },
  { category: "Services", percentage: 91 },
  { category: "Components", percentage: 78 },
];

export default function ComplianceChartExample() {
  return <ComplianceChart data={mockData} />;
}
