import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { FileText, Upload, Eye, CheckCircle, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type DocumentStatus = "approved" | "pending" | "expired" | "rejected" | "missing";

interface DocumentCardProps {
  documentType: string;
  status: DocumentStatus;
  expiryDate?: Date;
  lastUpdated?: Date;
  onAction?: () => void;
  className?: string;
}

export function DocumentCard({
  documentType,
  status,
  expiryDate,
  lastUpdated,
  onAction,
  className,
}: DocumentCardProps) {
  const getActionButton = () => {
    switch (status) {
      case "missing":
        return (
          <Button size="sm" onClick={onAction} data-testid="button-upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        );
      case "pending":
        return (
          <Button size="sm" variant="outline" onClick={onAction} data-testid="button-review">
            <Eye className="h-4 w-4 mr-2" />
            Review
          </Button>
        );
      case "expired":
      case "rejected":
        return (
          <Button size="sm" onClick={onAction} data-testid="button-renew">
            <Upload className="h-4 w-4 mr-2" />
            Renew
          </Button>
        );
      case "approved":
        return (
          <Button size="sm" variant="outline" onClick={onAction} data-testid="button-view">
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
        );
    }
  };

  const getExpiryInfo = () => {
    if (!expiryDate) return null;
    
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let colorClass = "text-muted-foreground";
    if (daysUntilExpiry < 0) {
      colorClass = "text-red-600 dark:text-red-400";
    } else if (daysUntilExpiry < 30) {
      colorClass = "text-yellow-600 dark:text-yellow-400";
    }

    return (
      <div className={`flex items-center gap-1 text-sm ${colorClass}`}>
        <Calendar className="h-3 w-3" />
        <span data-testid="text-expiry">
          {daysUntilExpiry < 0 ? "Expired" : `Expires in ${daysUntilExpiry} days`}
        </span>
      </div>
    );
  };

  return (
    <Card className={`min-h-40 hover-elevate ${className || ""}`} data-testid={`card-document-${documentType.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <CardTitle className="text-base font-medium">
              {documentType}
            </CardTitle>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2">
          {getExpiryInfo()}
          {lastUpdated && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span data-testid="text-last-updated">
                Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {getActionButton()}
      </CardFooter>
    </Card>
  );
}
