import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Check if it's a dynamic import/chunk loading failure
    const isChunkLoadFailed =
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Error loading chunk') ||
      (error.name === 'TypeError' && error.message?.includes('import'));

    if (isChunkLoadFailed) {
      console.warn('Chunk load error caught by ErrorBoundary. Reloading page...');
      const reloadKey = 'chunk-load-failed-reload';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      
      // Auto-reload only if we haven't reloaded in the last 10 seconds to avoid reload loops
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(reloadKey, now.toString());
        window.location.reload();
        return;
      }
    }

    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-2xl w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 font-mono break-all">
                {this.state.error?.message || 'Unknown error occurred'}
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </div>

            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mt-6">
                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-96">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

