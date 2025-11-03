import { Link } from "wouter";
import { Sprout } from "lucide-react";

interface HeaderProps {
  showStartOver?: boolean;
}

export default function Header({ showStartOver = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-2 hover-elevate rounded-md px-3 py-2 -ml-3">
              <Sprout className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Solidarity Gardens</span>
            </div>
          </Link>
          {showStartOver && (
            <Link href="/" data-testid="link-start-over">
              <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Start Over
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
