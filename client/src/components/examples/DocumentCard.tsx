import { DocumentCard } from '../DocumentCard';

export default function DocumentCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <DocumentCard
        documentType="ISO 9001 Certificate"
        status="approved"
        expiryDate={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
        lastUpdated={new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)}
        onAction={() => console.log('View document')}
      />
      <DocumentCard
        documentType="Insurance Policy"
        status="pending"
        expiryDate={new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)}
        lastUpdated={new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)}
        onAction={() => console.log('Review document')}
      />
      <DocumentCard
        documentType="Safety Certification"
        status="expired"
        expiryDate={new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)}
        lastUpdated={new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)}
        onAction={() => console.log('Renew document')}
      />
      <DocumentCard
        documentType="HACCP Certificate"
        status="missing"
        onAction={() => console.log('Upload document')}
      />
      <DocumentCard
        documentType="ESG Report"
        status="rejected"
        expiryDate={new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)}
        lastUpdated={new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)}
        onAction={() => console.log('Re-upload document')}
      />
    </div>
  );
}
