import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/RiskBadge";
import { ArrowLeft, Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Vendor, VendorDocument, DocumentType } from "@shared/schema";
import { format } from "date-fns";

export default function VendorDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const { data: vendor, isLoading: vendorLoading } = useQuery<Vendor>({
    queryKey: [`/api/vendors/${id}`],
    enabled: !!id,
  });

  const { data: documents, isLoading: documentsLoading } = useQuery<VendorDocument[]>({
    queryKey: [`/api/vendors/${id}/documents`],
    enabled: !!id,
  });

  const { data: documentTypes } = useQuery<DocumentType[]>({
    queryKey: ["/api/document-types"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await fetch(`/api/vendors/${id}/documents`, {
        method: "POST",
        body: formData,
        credentials: "include",
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Upload failed");
        }
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${id}/documents`] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedDocType("");
      setIssueDate("");
      setExpiryDate("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return await apiRequest("POST", `/api/documents/${documentId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${id}/documents`] });
      toast({
        title: "Success",
        description: "Document approved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve document",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ documentId, reason }: { documentId: string; reason: string }) => {
      return await apiRequest("POST", `/api/documents/${documentId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendors/${id}/documents`] });
      toast({
        title: "Success",
        description: "Document rejected",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject document",
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!selectedFile || !selectedDocType) {
      toast({
        title: "Error",
        description: "Please select a file and document type",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("documentTypeId", selectedDocType);
    if (issueDate) formData.append("issueDate", issueDate);
    if (expiryDate) formData.append("expiryDate", expiryDate);

    uploadMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      missing: { icon: AlertCircle, label: "Missing", className: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700" },
      pending: { icon: Clock, label: "Pending Review", className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800" },
      approved: { icon: CheckCircle, label: "Approved", className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" },
      rejected: { icon: XCircle, label: "Rejected", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" },
      expired: { icon: AlertCircle, label: "Expired", className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" },
    };

    const statusConfig = config[status as keyof typeof config];
    const Icon = statusConfig.icon;

    return (
      <Badge variant="outline" className={`${statusConfig.className} text-xs px-2 py-0.5`}>
        <Icon className="h-3 w-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getVendorStatusBadge = (status: string) => {
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

  if (vendorLoading || documentsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading vendor details...</div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-muted-foreground">Vendor not found</div>
        <Button onClick={() => navigate("/vendors")} data-testid="button-back-to-vendors">
          Back to Vendors
        </Button>
      </div>
    );
  }

  // Get required document types for this vendor's category
  const requiredDocTypes = documentTypes?.filter(dt => 
    dt.isRequired && dt.applicableCategories.includes(vendor.category)
  ) || [];
  
  const requiredDocTypeIds = new Set(requiredDocTypes.map(dt => dt.id));
  
  // Only count approved documents that are required (not optional)
  const approvedCount = documents?.filter(d => 
    d.status === "approved" && requiredDocTypeIds.has(d.documentTypeId)
  ).length || 0;
  
  const totalRequired = requiredDocTypes.length;
  const compliancePercentage = totalRequired === 0 ? 100 : Math.round((approvedCount / totalRequired) * 100);

  // Create a combined list that includes both uploaded documents and missing required documents
  const documentStatusMap = new Map<string, VendorDocument>();
  documents?.forEach(doc => {
    documentStatusMap.set(doc.documentTypeId, doc);
  });

  // Build display list: uploaded docs + missing required docs
  const displayDocuments = [
    // Uploaded documents
    ...(documents || []),
    // Missing required documents
    ...requiredDocTypes
      .filter(docType => !documentStatusMap.has(docType.id))
      .map(docType => ({
        id: `missing-${docType.id}`,
        vendorId: vendor.id,
        documentTypeId: docType.id,
        status: "missing" as const,
        fileName: null,
        filePath: null,
        fileSize: null,
        issueDate: null,
        expiryDate: null,
        uploadedBy: null,
        uploadedAt: null,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/vendors")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold" data-testid="text-vendor-name">{vendor.name}</h1>
          <p className="text-muted-foreground">{vendor.category}</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-document">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-upload-document">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a compliance document for this vendor
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="document-type">Document Type</Label>
                <select
                  id="document-type"
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  data-testid="select-document-type"
                >
                  <option value="">Select document type</option>
                  {documentTypes?.filter(dt => 
                    dt.applicableCategories.includes(vendor.category)
                  ).map((docType) => (
                    <option key={docType.id} value={docType.id}>
                      {docType.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  data-testid="input-file"
                />
              </div>
              <div>
                <Label htmlFor="issue-date">Issue Date</Label>
                <Input
                  id="issue-date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  data-testid="input-issue-date"
                />
              </div>
              <div>
                <Label htmlFor="expiry-date">Expiry Date</Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  data-testid="input-expiry-date"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                  data-testid="button-cancel-upload"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending || !selectedFile || !selectedDocType}
                  data-testid="button-submit-upload"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskBadge level={vendor.riskLevel} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {getVendorStatusBadge(vendor.status)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-compliance-percentage">
              {totalRequired === 0 ? "N/A" : `${compliancePercentage}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalRequired === 0 
                ? "No documents required" 
                : `${approvedCount} of ${totalRequired} documents approved`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Legal Entity Name</div>
              <div className="text-sm">{vendor.legalEntityName || "N/A"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Primary Contact</div>
              <div className="text-sm">{vendor.primaryContactName || "N/A"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Contact Email</div>
              <div className="text-sm">{vendor.primaryContactEmail || "N/A"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Contact Phone</div>
              <div className="text-sm">{vendor.primaryContactPhone || "N/A"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Compliance documents for this vendor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No documents required for this vendor category
              </div>
            ) : (
              displayDocuments.map((doc) => {
                const docType = documentTypes?.find(dt => dt.id === doc.documentTypeId);
                const isMissing = doc.id.toString().startsWith("missing-");
                
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                    data-testid={isMissing ? `document-missing-${doc.documentTypeId}` : `document-${doc.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{docType?.name || "Unknown"}</div>
                        {!isMissing && doc.fileName && (
                          <div className="text-sm text-muted-foreground">
                            {doc.fileName}
                          </div>
                        )}
                        {!isMissing && doc.expiryDate && (
                          <div className="text-xs text-muted-foreground">
                            Expires: {format(new Date(doc.expiryDate), "MMM d, yyyy")}
                          </div>
                        )}
                        {isMissing && (
                          <div className="text-sm text-muted-foreground">
                            This required document has not been uploaded yet
                          </div>
                        )}
                      </div>
                      <div>
                        {getStatusBadge(doc.status)}
                      </div>
                    </div>
                    {doc.status === "pending" && !isMissing && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveMutation.mutate(doc.id)}
                          disabled={approveMutation.isPending}
                          data-testid="button-approve-document"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectMutation.mutate({ documentId: doc.id, reason: "Document does not meet requirements" })}
                          disabled={rejectMutation.isPending}
                          data-testid="button-reject-document"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
