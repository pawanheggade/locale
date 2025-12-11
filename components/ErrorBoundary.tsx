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
  // FIX: Converted class properties to a constructor for state initialization
  // to ensure compatibility with older build toolchains that might not fully support
  // the class fields syntax, which could lead to incorrect type inference for `this.props`.
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

  render() {
    if (this.state.hasError) {
      // The handleReset method was removed and its logic inlined here as an arrow function,
      // which is cleaner since the method didn't use `this`.
      return <ErrorFallback onReset={() => window.location.reload()} />;
    }

    return this.props.children;
  }
}
