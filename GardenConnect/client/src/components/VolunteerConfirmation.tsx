import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Sprout } from "lucide-react";

export default function VolunteerConfirmation() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6">
      <div className="max-w-lg w-full">
        <Card>
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Sprout className="h-16 w-16 text-primary" />
                <CheckCircle className="h-8 w-8 text-primary absolute -bottom-1 -right-1 bg-background rounded-full" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold" data-testid="text-confirmation-title">
                Thank You for Signing Up!
              </h1>
              <p className="text-lg text-muted-foreground" data-testid="text-confirmation-message">
                We'll match you with a garden soon and reach out via email with volunteer opportunities.
              </p>
            </div>
            <div className="pt-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                data-testid="button-back-home"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
