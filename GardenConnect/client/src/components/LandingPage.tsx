import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sprout, UserPlus, Shield } from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="flex justify-center">
          <Sprout className="h-16 w-16 text-primary" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight" data-testid="text-title">
            Solidarity Gardens Volunteer Matching
          </h1>
          <p className="text-xl text-muted-foreground" data-testid="text-tagline">
            Growing food for our neighbors and communities
          </p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            className="px-8 w-full sm:w-auto"
            onClick={() => setLocation("/volunteer")}
            data-testid="button-volunteer"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Volunteer Sign-Up
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="px-8 w-full sm:w-auto"
            onClick={() => setLocation("/admin-login")}
            data-testid="button-admin"
          >
            <Shield className="h-5 w-5 mr-2" />
            Admin Login
          </Button>
        </div>
      </div>
    </div>
  );
}
