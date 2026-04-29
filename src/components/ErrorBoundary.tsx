import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
          <div className="max-w-md w-full bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 text-center space-y-5 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">משהו השתבש</h2>
              <p className="text-sm text-muted-foreground">
                אירעה שגיאה לא צפויה. נסה לרענן את הדף או חזור לעמוד הבית.
              </p>
              {this.state.error?.message && (
                <p className="text-[10px] text-muted-foreground/60 font-mono mt-3 px-3 py-2 bg-muted/30 rounded-lg break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReset} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 ml-2" />
                נסה שוב
              </Button>
              <Button onClick={this.handleHome} size="sm">
                <Home className="w-4 h-4 ml-2" />
                לדף הבית
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
