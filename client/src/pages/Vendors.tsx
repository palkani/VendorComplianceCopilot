import { useState } from "react";
import { VendorTable } from "@/components/VendorTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const mockVendors = [
  {
    id: "1",
    name: "Acme Packaging Inc.",
    category: "Packaging",
    riskLevel: "low" as const,
    compliancePercentage: 95,
    status: "active" as const,
  },
  {
    id: "2",
    name: "GlobalTech Logistics",
    category: "Logistics",
    riskLevel: "medium" as const,
    compliancePercentage: 67,
    status: "active" as const,
  },
  {
    id: "3",
    name: "Premier Raw Materials Ltd.",
    category: "Raw Material",
    riskLevel: "high" as const,
    compliancePercentage: 42,
    status: "active" as const,
  },
  {
    id: "4",
    name: "SafetyFirst Consultants",
    category: "Services",
    riskLevel: "low" as const,
    compliancePercentage: 88,
    status: "onboarding" as const,
  },
  {
    id: "5",
    name: "EcoComponents Supplier",
    category: "Component Supplier",
    riskLevel: "medium" as const,
    compliancePercentage: 73,
    status: "active" as const,
  },
  {
    id: "6",
    name: "QualityFirst Manufacturing",
    category: "Raw Material",
    riskLevel: "low" as const,
    compliancePercentage: 91,
    status: "active" as const,
  },
];

export default function Vendors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredVendors = mockVendors.filter((vendor) => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || vendor.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2" data-testid="text-page-title">Vendors</h1>
          <p className="text-muted-foreground">
            Manage your vendor list and compliance status
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-bulk-import">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-vendor">
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-add-vendor">
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
                <DialogDescription>
                  Enter the vendor details to add them to your system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="vendor-name">Vendor Name</Label>
                  <Input
                    id="vendor-name"
                    placeholder="Enter vendor name"
                    data-testid="input-vendor-name"
                  />
                </div>
                <div>
                  <Label htmlFor="vendor-category">Category</Label>
                  <Select>
                    <SelectTrigger id="vendor-category" data-testid="select-vendor-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="packaging">Packaging</SelectItem>
                      <SelectItem value="logistics">Logistics</SelectItem>
                      <SelectItem value="raw-material">Raw Material</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="components">Component Supplier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vendor-risk">Risk Level</Label>
                  <Select>
                    <SelectTrigger id="vendor-risk" data-testid="select-vendor-risk">
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vendor-contact">Primary Contact Email</Label>
                  <Input
                    id="vendor-contact"
                    type="email"
                    placeholder="contact@vendor.com"
                    data-testid="input-vendor-contact"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    console.log('Add vendor');
                    setIsAddDialogOpen(false);
                  }} data-testid="button-submit-vendor">
                    Add Vendor
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-vendors"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-filter-category">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Packaging">Packaging</SelectItem>
            <SelectItem value="Logistics">Logistics</SelectItem>
            <SelectItem value="Raw Material">Raw Material</SelectItem>
            <SelectItem value="Services">Services</SelectItem>
            <SelectItem value="Component Supplier">Component Supplier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <VendorTable
        vendors={filteredVendors}
        onViewVendor={(id) => console.log('View vendor:', id)}
        onEditVendor={(id) => console.log('Edit vendor:', id)}
        onArchiveVendor={(id) => console.log('Archive vendor:', id)}
      />
    </div>
  );
}
