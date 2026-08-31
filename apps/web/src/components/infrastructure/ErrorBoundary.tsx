import { Component, type ReactNode } from 'react';

export interface InfrastructureErrorBoundaryProps {
  readonly children: ReactNode;
  readonly requestId: string;
  readonly onRetry?: () => void;
}

interface InfrastructureErrorBoundaryState {
  readonly hasError: boolean;
}

/** Keeps a component fault from erasing the server-rendered route shell. */
export class InfrastructureErrorBoundary extends Component<
  InfrastructureErrorBoundaryProps,
  InfrastructureErrorBoundaryState
> {
  public state: InfrastructureErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): InfrastructureErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(): void {
    // Provider-native diagnostics can be attached at the application boundary.
    // The rendered state below deliberately exposes only the correlation ID.
  }

  private readonly retry = (): void => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <section
        className="infra-error-boundary"
        role="alert"
        aria-labelledby="infrastructure-section-error"
      >
        <h2 id="infrastructure-section-error">
          Infrastructure section unavailable
        </h2>
        <p>
          This section could not be rendered safely. Retry the canonical read or
          review system status.
        </p>
        <p>
          Request ID: <code>{this.props.requestId}</code>
        </p>
        <div className="infra-actions">
          <button type="button" onClick={this.retry}>
            Retry
          </button>
          <a href="/system/degraded">View system status</a>
        </div>
      </section>
    );
  }
}

export default InfrastructureErrorBoundary;
