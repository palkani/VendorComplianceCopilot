import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "./RiskBadge";
import { Eye, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Vendor {
  id: string;
  name: string;
  category: string;
  riskLevel: "low" | "medium" | "high";
  compliancePercentage: number;
  status: "active" | "inactive" | "onboarding";
}

interface VendorTableProps {
  vendors: Vendor[];
  onViewVendor?: (vendorId: string) => void;
  onEditVendor?: (vendorId: string) => void;
  onArchiveVendor?: (vendorId: string) => void;
}

export function VendorTable({ vendors, onViewVendor, onEditVendor, onArchiveVendor }: VendorTableProps) {
  const getComplianceColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
      inactive: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700",
      onboarding: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    };

    return (
      <Badge variant="outline" className={`${config[status as keyof typeof config]} text-xs px-2 py-0.5`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="rounded-md border" data-testid="table-vendors">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">Vendor Name</TableHead>
            <TableHead className="font-semibold">Category</TableHead>
            <TableHead className="font-semibold">Risk Level</TableHead>
            <TableHead className="font-semibold">Compliance</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-right font-semibold w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((vendor) => (
            <TableRow key={vendor.id} className="hover-elevate" data-testid={`row-vendor-${vendor.id}`}>
              <TableCell className="font-medium" data-testid="text-vendor-name">
                {vendor.name}
              </TableCell>
              <TableCell data-testid="text-vendor-category">
                {vendor.category}
              </TableCell>
              <TableCell>
                <RiskBadge level={vendor.riskLevel} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-full max-w-[100px] bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        vendor.compliancePercentage >= 80
                          ? "bg-green-600 dark:bg-green-400"
                          : vendor.compliancePercentage >= 50
                          ? "bg-yellow-600 dark:bg-yellow-400"
                          : "bg-red-600 dark:bg-red-400"
                      }`}
                      style={{ width: `${vendor.compliancePercentage}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${getComplianceColor(vendor.compliancePercentage)}`} data-testid="text-compliance-percentage">
                    {vendor.compliancePercentage}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(vendor.status)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewVendor?.(vendor.id)}
                    data-testid="button-view-vendor"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" data-testid="button-vendor-actions">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditVendor?.(vendor.id)} data-testid="button-edit-vendor">
                        Edit Vendor
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => console.log('Send reminder')} data-testid="button-send-reminder">
                        Send Reminder
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onArchiveVendor?.(vendor.id)} className="text-red-600" data-testid="button-archive-vendor">
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
