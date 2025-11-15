import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DocumentCard } from "@/components/DocumentCard";
import { Building2 } from "lucide-react";

const mockVendorData = {
  vendorName: "Acme Packaging Inc.",
  completionPercentage: 60,
  documents: [
    {
      id: "1",
      documentType: "ISO 9001 Certificate",
      status: "approved" as const,
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      lastUpdated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      id: "2",
      documentType: "Insurance Policy",
      status: "pending" as const,
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: "3",
      documentType: "Safety Certification",
      status: "expired" as const,
      expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      lastUpdated: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
    },
    {
      id: "4",
      documentType: "HACCP Certificate",
      status: "missing" as const,
    },
    {
      id: "5",
      documentType: "ESG Report",
      status: "missing" as const,
    },
  ],
};

export default function VendorPortal() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader className="text-center border-b">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              Welcome, {mockVendorData.vendorName}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Please review and upload the required compliance documents below
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Completion Progress</span>
                <span className="text-muted-foreground">
                  {mockVendorData.completionPercentage}%
                </span>
              </div>
              <Progress value={mockVendorData.completionPercentage} />
            </div>
            <p className="text-sm text-muted-foreground">
              You have {mockVendorData.documents.filter(d => d.status === "missing").length} pending documents to upload
            </p>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-semibold mb-4">Required Documents</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {mockVendorData.documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                documentType={doc.documentType}
                status={doc.status}
                expiryDate={doc.expiryDate}
                lastUpdated={doc.lastUpdated}
                onAction={() => console.log('Action for:', doc.id)}
              />
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              If you have any questions or need assistance, please contact your compliance manager.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
