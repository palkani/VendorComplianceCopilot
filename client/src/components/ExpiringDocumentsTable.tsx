import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ExpiringDocument {
  id: string;
  vendorName: string;
  documentType: string;
  expiryDate: Date;
  status: "approved" | "pending" | "expired";
}

interface ExpiringDocumentsTableProps {
  documents: ExpiringDocument[];
  onSendReminder?: (documentId: string) => void;
}

export function ExpiringDocumentsTable({ documents, onSendReminder }: ExpiringDocumentsTableProps) {
  const getDaysUntilExpiry = (expiryDate: Date) => {
    const now = new Date();
    return Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <Card data-testid="card-expiring-documents">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Upcoming Expirations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.map((doc) => {
            const daysUntil = getDaysUntilExpiry(doc.expiryDate);
            const urgencyClass = daysUntil < 0 
              ? "text-red-600 dark:text-red-400" 
              : daysUntil < 30 
              ? "text-yellow-600 dark:text-yellow-400" 
              : "text-muted-foreground";

            return (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-4 p-4 rounded-md border hover-elevate"
                data-testid={`row-expiring-${doc.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate" data-testid="text-vendor-name">
                      {doc.vendorName}
                    </p>
                    <StatusBadge status={doc.status} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate" data-testid="text-document-type">
                    {doc.documentType}
                  </p>
                  <p className={`text-sm font-medium mt-1 ${urgencyClass}`} data-testid="text-expiry-info">
                    {daysUntil < 0 
                      ? `Expired ${formatDistanceToNow(doc.expiryDate, { addSuffix: true })}`
                      : `Expires in ${daysUntil} days`
                    }
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSendReminder?.(doc.id)}
                  data-testid="button-send-reminder"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Remind
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
