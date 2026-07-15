import { Component, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="rounded-xl border border-malicious/30 bg-malicious/5 p-8 max-w-md text-center space-y-4">
            <p className="font-mono text-malicious text-sm uppercase tracking-wider">Something went wrong</p>
            <p className="font-mono text-xs text-muted-foreground">{this.state.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, message: "" })}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-mono text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
