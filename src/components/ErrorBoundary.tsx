import React, { Component, ReactNode } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onReturnHome?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error Boundary caught an error:', error);
    console.error('📍 Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo: errorInfo.componentStack || 'No component stack available'
    });
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: '',
        retryCount: prevState.retryCount + 1
      }));
      
      if (this.props.onReset) {
        this.props.onReset();
      }
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: '',
      retryCount: 0
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private getErrorType(error: Error): string {
    if (error.message.includes('audio') || error.message.includes('Audio')) {
      return 'Audio Error';
    }
    if (error.message.includes('canvas') || error.message.includes('Canvas')) {
      return 'Rendering Error';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network Error';
    }
    if (error.message.includes('memory') || error.message.includes('Memory')) {
      return 'Memory Error';
    }
    return 'Application Error';
  }

  private getErrorSuggestion(error: Error): string {
    const errorType = this.getErrorType(error);
    
    switch (errorType) {
      case 'Audio Error':
        return 'Try using a different audio file format (MP3, WAV) or check your browser permissions for audio playback.';
      case 'Rendering Error':
        return 'Your browser may not support required graphics features. Try updating your browser or using a different device.';
      case 'Network Error':
        return 'Check your internet connection and try again.';
      case 'Memory Error':
        return 'Close other browser tabs and applications to free up memory, then try again.';
      default:
        return 'Try refreshing the page or restarting the application.';
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = this.state.error ? this.getErrorType(this.state.error) : 'Unknown Error';
      const suggestion = this.state.error ? this.getErrorSuggestion(this.state.error) : '';
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="cosmic-card max-w-lg w-full p-6 space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertTriangle className="w-16 h-16 text-destructive" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-destructive">{errorType}</h1>
                <p className="text-muted-foreground">
                  Something went wrong with the rhythm game
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-muted/20 border border-border/50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm text-foreground">What happened?</h3>
                <p className="text-sm text-muted-foreground">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
              </div>

              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm text-accent">How to fix it:</h3>
                <p className="text-sm text-muted-foreground">{suggestion}</p>
              </div>

              {this.state.retryCount > 0 && (
                <div className="bg-neon-orange/10 border border-neon-orange/30 rounded-lg p-3">
                  <p className="text-sm text-neon-orange">
                    Retry attempt {this.state.retryCount} of {this.maxRetries}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              
              {this.props.onReturnHome && (
                <Button
                  onClick={this.props.onReturnHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              )}
            </div>

            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Technical Details
              </summary>
              <div className="mt-2 p-2 bg-muted/20 rounded border font-mono text-xs overflow-auto max-h-32">
                <p><strong>Error:</strong> {this.state.error?.name}</p>
                <p><strong>Message:</strong> {this.state.error?.message}</p>
                <p><strong>Stack:</strong> {this.state.error?.stack?.slice(0, 200)}...</p>
              </div>
            </details>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}