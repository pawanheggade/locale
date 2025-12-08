import React, { Component, ErrorInfo, ReactNode } from 'react';
import { XCircleIcon } from './Icons';
import { Button } from './ui/Button';

// A simple fallback component with a reset button
const ErrorFallback = ({ onReset }: { onReset: () => void }) => (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4 rounded" role="alert">
        <div className="flex">
            <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
                <p className="text-sm font-semibold text-red-800">
                    Something went wrong
                </p>
                <p className="mt-1 text-sm text-red-700">
                    An unexpected error occurred. Please try again.
                </p>
                <div className="mt-4">
                    <Button
                        onClick={onReset}
                        variant="pill-red"
                        className="rounded-md"
                    >
                        Try again
                    </Button>
                </div>
            </div>
        </div>
    </div>
);


interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    // A full page reload is a more robust way to recover from unexpected errors
    // than simply trying to re-render. It clears corrupted state and ensures a fresh start.
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}