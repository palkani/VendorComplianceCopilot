import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, AlertCircle, Minus } from "lucide-react";

type DocumentStatus = "approved" | "pending" | "expired" | "rejected" | "missing";

interface StatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

const statusConfig: Record<DocumentStatus, { label: string; icon: React.ReactNode; className: string }> = {
  approved: {
    label: "Approved",
    icon: <CheckCircle className="h-3 w-3" />,
    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  },
  pending: {
    label: "Pending Review",
    icon: <Clock className="h-3 w-3" />,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  },
  expired: {
    label: "Expired",
    icon: <AlertCircle className="h-3 w-3" />,
    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="h-3 w-3" />,
    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  },
  missing: {
    label: "Missing",
    icon: <Minus className="h-3 w-3" />,
    className: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge
      variant="outline"
      className={`${config.className} ${className || ""} flex items-center gap-1 px-3 py-1 text-xs font-medium`}
      data-testid={`badge-status-${status}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}
