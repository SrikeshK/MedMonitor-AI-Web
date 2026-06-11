import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import GlowButton from './GlowButton';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-error/20 blur-3xl rounded-full" />
              <div className="relative bg-white/5 border border-error/20 p-6 rounded-3xl">
                <AlertTriangle className="w-16 h-16 text-error mx-auto" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-display font-bold text-white">System Interruption</h1>
              <p className="text-slate-400">
                We've encountered an unexpected issue while processing medical data.
                Don't worry, your data remains secure.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <GlowButton
                onClick={this.handleReset}
                className="bg-white/10 text-white hover:bg-white/20 border-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry System
              </GlowButton>
              <GlowButton
                onClick={() => window.location.href = '/'}
                variant="primary"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </GlowButton>
            </div>

            <div className="pt-8">
              <p className="text-xs text-slate-500 font-mono">
                Error Ref: {this.state.error?.message || 'Unknown Exception'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
