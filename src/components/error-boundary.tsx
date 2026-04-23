"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** 可选的 fallback 自定义渲染 */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <RefreshCw className="size-6 text-destructive" />
          </div>
          <div>
            <p className="font-medium text-foreground">页面出现了问题</p>
            <p className="mt-1 text-sm text-muted-foreground">
              请尝试刷新页面，如果问题持续请联系我们
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={this.handleReset}>
              重试
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              刷新页面
            </Button>
          </div>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-muted p-4 text-left text-xs text-muted-foreground">
              {this.state.error.message}
              {"\n"}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
