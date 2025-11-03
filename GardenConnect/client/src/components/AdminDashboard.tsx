import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users, Leaf, Target, Link as LinkIcon, LogOut, List } from "lucide-react";
import ViewVolunteersTab from "./admin/ViewVolunteersTab";
import PostGardenTab from "./admin/PostGardenTab";
import AutoMatchTab from "./admin/AutoMatchTab-v2"; // UPDATED: Using V2
import ManualMatchTab from "./admin/ManualMatchTab-v2"; // UPDATED: Using V2
import CurrentMatchesTab from "./admin/CurrentMatchesTab"; // NEW: Match management

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("volunteers");

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("adminAuthenticated");
    if (isAuthenticated !== "true") {
      setLocation("/admin-login");
    }
  }, [setLocation]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuthenticated");
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            <Button
              variant="outline"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1">
            <TabsTrigger value="volunteers" className="gap-2" data-testid="tab-volunteers">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">View Volunteers</span>
              <span className="sm:hidden">Volunteers</span>
            </TabsTrigger>
            <TabsTrigger value="gardens" className="gap-2" data-testid="tab-gardens">
              <Leaf className="h-4 w-4" />
              <span className="hidden sm:inline">Post Gardens</span>
              <span className="sm:hidden">Gardens</span>
            </TabsTrigger>
            <TabsTrigger value="auto-match" className="gap-2" data-testid="tab-auto-match">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Auto-Match</span>
              <span className="sm:hidden">Auto</span>
            </TabsTrigger>
            <TabsTrigger value="manual-match" className="gap-2" data-testid="tab-manual-match">
              <LinkIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Manual Match</span>
              <span className="sm:hidden">Manual</span>
            </TabsTrigger>
            <TabsTrigger value="current-matches" className="gap-2" data-testid="tab-current-matches">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Current Matches</span>
              <span className="sm:hidden">Matches</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="volunteers" className="space-y-4">
            <ViewVolunteersTab />
          </TabsContent>

          <TabsContent value="gardens" className="space-y-4">
            <PostGardenTab />
          </TabsContent>

          <TabsContent value="auto-match" className="space-y-4">
            <AutoMatchTab />
          </TabsContent>

          <TabsContent value="manual-match" className="space-y-4">
            <ManualMatchTab />
          </TabsContent>

          <TabsContent value="current-matches" className="space-y-4">
            <CurrentMatchesTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
