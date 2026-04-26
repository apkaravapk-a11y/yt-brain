import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: any) { console.error("Watchlight crash:", error, info); }

  reset = () => { this.setState({ error: null }); };

  render() {
    if (this.state.error) {
      return (
        <div className="p-10 max-w-2xl mx-auto">
          <div className="elev-2 rounded-2xl p-8 text-center">
            <span className="material-symbols-rounded" style={{ fontSize: 48, color: "var(--md-error)" }}>error</span>
            <h1 className="text-xl font-medium text-on-surface mt-4">Something broke on this page</h1>
            <p className="text-on-surface-variant text-sm mt-2 mb-1">The rest of the app still works — just this view crashed.</p>
            <details className="mt-4 text-xs text-on-surface-variant">
              <summary className="cursor-pointer">Show error</summary>
              <pre className="mt-2 text-left bg-surface-3 p-3 rounded overflow-auto">{this.state.error.message}</pre>
            </details>
            <div className="flex gap-2 justify-center mt-6">
              <button className="btn" onClick={() => location.reload()}>Reload</button>
              <button className="btn btn-primary" onClick={this.reset}>Try again</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
