import { ExpiringDocumentsTable } from '../ExpiringDocumentsTable';

const mockDocuments = [
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

export default function ExpiringDocumentsTableExample() {
  return (
    <ExpiringDocumentsTable
      documents={mockDocuments}
      onSendReminder={(id) => console.log('Send reminder for:', id)}
    />
  );
}
