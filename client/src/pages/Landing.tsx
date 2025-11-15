import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileCheck, Bell, Users, TrendingUp, Lock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-4">Vendor Compliance Copilot</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track supplier compliance documents, manage expiry dates, and automate vendor renewal reminders with confidence
          </p>
          <Button size="lg" onClick={() => window.location.href = "/api/login"} data-testid="button-login">
            Sign In to Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <FileCheck className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Document Lifecycle</CardTitle>
              <CardDescription>
                Comprehensive document tracking from upload to expiry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Upload and categorize compliance documents</li>
                <li>• Track issue and expiry dates</li>
                <li>• Review and approval workflows</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Bell className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Automated Reminders</CardTitle>
              <CardDescription>
                Never miss a renewal deadline again
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Configurable notification rules</li>
                <li>• Email alerts for expiring documents</li>
                <li>• Vendor portal for self-service</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Vendor Portal</CardTitle>
              <CardDescription>
                Secure external access for vendors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Magic link access (no passwords)</li>
                <li>• View required documents</li>
                <li>• Upload compliance certificates</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Lock className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>
                Control who can see and do what
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Admin, Manager, and Read-only roles</li>
                <li>• Granular permissions</li>
                <li>• Complete audit trail</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Compliance Dashboard</CardTitle>
              <CardDescription>
                Real-time insights and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Compliance rate by vendor category</li>
                <li>• Expiring documents overview</li>
                <li>• Risk level distribution</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>
                Categorize and prioritize vendors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Low, Medium, High risk levels</li>
                <li>• Vendor categorization</li>
                <li>• Status tracking (Active/Inactive)</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Ready to streamline your vendor compliance management?
          </p>
          <Button size="lg" onClick={() => window.location.href = "/api/login"} data-testid="button-login-footer">
            Sign In Now
          </Button>
        </div>
      </div>
    </div>
  );
}
