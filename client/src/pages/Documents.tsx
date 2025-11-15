import { useState } from "react";
import { DocumentCard } from "@/components/DocumentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

type DocumentStatus = "approved" | "pending" | "expired" | "rejected" | "missing";

const mockDocuments = [
  {
    id: "1",
    vendorName: "Acme Packaging Inc.",
    documentType: "ISO 9001 Certificate",
    status: "approved" as DocumentStatus,
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    vendorName: "GlobalTech Logistics",
    documentType: "Insurance Policy",
    status: "pending" as DocumentStatus,
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    vendorName: "Premier Raw Materials Ltd.",
    documentType: "Safety Certification",
    status: "expired" as DocumentStatus,
    expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    vendorName: "SafetyFirst Consultants",
    documentType: "HACCP Certificate",
    status: "missing" as DocumentStatus,
  },
  {
    id: "5",
    vendorName: "EcoComponents Supplier",
    documentType: "ESG Report",
    status: "rejected" as DocumentStatus,
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "6",
    vendorName: "Acme Packaging Inc.",
    documentType: "ISO 27001 Certificate",
    status: "approved" as DocumentStatus,
    expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
];

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesSearch =
      doc.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">Documents</h1>
        <p className="text-muted-foreground">
          Track and manage all vendor compliance documents
        </p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents or vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-documents"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-filter-status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="missing">Missing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments.map((doc) => (
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

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No documents found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
