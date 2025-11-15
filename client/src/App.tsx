import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import Dashboard from "@/pages/Dashboard";
import Vendors from "@/pages/Vendors";
import Documents from "@/pages/Documents";
import VendorPortal from "@/pages/VendorPortal";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/vendors" component={Vendors} />
      <Route path="/documents" component={Documents} />
      <Route path="/portal/:token" component={VendorPortal} />
      <Route path="/reports">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Reports</h1>
            <p className="text-muted-foreground">
              Generate compliance reports and exports
            </p>
          </div>
          <div className="text-center py-12 text-muted-foreground">
            Reports functionality coming soon
          </div>
        </div>
      </Route>
      <Route path="/settings">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Configure document types, notification rules, and user permissions
            </p>
          </div>
          <div className="text-center py-12 text-muted-foreground">
            Settings functionality coming soon
          </div>
        </div>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between p-4 border-b">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto p-6">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
