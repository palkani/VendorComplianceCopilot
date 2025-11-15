import { StatCard } from "@/components/StatCard";
import { ComplianceChart } from "@/components/ComplianceChart";
import { ExpiringDocumentsTable } from "@/components/ExpiringDocumentsTable";
import { CheckCircle, AlertTriangle, Clock, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ComplianceStats {
  overallCompliance: number;
  totalVendors: number;
  activeVendors: number;
  inactiveVendors: number;
  highRiskVendors: number;
  mediumRiskVendors: number;
  lowRiskVendors: number;
  totalDocuments: number;
  approvedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  expiredDocuments: number;
  missingDocuments: number;
}

interface ComplianceByCategory {
  category: string;
  totalVendors: number;
  compliantVendors: number;
  compliancePercentage: number;
}

interface ExpiringDocument {
  id: string;
  vendorName: string;
  documentType: string;
  expiryDate: Date;
  status: "approved" | "pending" | "expired" | "rejected" | "missing";
}

export default function Dashboard() {
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<ComplianceStats>({
    queryKey: ["/api/stats/compliance"],
  });

  const { data: categoryData, isLoading: categoryLoading } = useQuery<ComplianceByCategory[]>({
    queryKey: ["/api/stats/compliance-by-category"],
  });

  const { data: expiringDocs, isLoading: expiringLoading } = useQuery<ExpiringDocument[]>({
    queryKey: ["/api/stats/expiring-documents"],
  });

  useEffect(() => {
    if (statsError && isUnauthorizedError(statsError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [statsError, toast]);

  const chartData = categoryData?.map(item => ({
    category: item.category,
    percentage: Math.round(item.compliancePercentage),
  })) || [];

  const expiringDocuments = expiringDocs?.map(doc => ({
    ...doc,
    expiryDate: new Date(doc.expiryDate),
    status: doc.status as "approved" | "pending" | "expired",
  })) || [];

  const calculateExpiringThisMonth = () => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return expiringDocs?.filter(doc => {
      const expiry = new Date(doc.expiryDate);
      return expiry >= now && expiry <= endOfMonth;
    }).length || 0;
  };

  if (statsLoading || categoryLoading || expiringLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

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
          value={`${Math.round(stats?.overallCompliance || 0)}%`}
          icon={CheckCircle}
        />
        <StatCard
          title="Vendors at Risk"
          value={stats?.highRiskVendors || 0}
          icon={AlertTriangle}
        />
        <StatCard
          title="Expiring This Month"
          value={calculateExpiringThisMonth()}
          icon={Clock}
        />
        <StatCard
          title="Total Vendors"
          value={stats?.totalVendors || 0}
          icon={Building2}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ComplianceChart data={chartData} />
        <ExpiringDocumentsTable
          documents={expiringDocuments}
          onSendReminder={(id) => console.log('Send reminder for:', id)}
        />
      </div>
    </div>
  );
}
