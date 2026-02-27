import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("AppErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Hubo un error al cargar la app</h1>
            <p style={{ color: "#666", marginBottom: "1.5rem" }}>{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "0.5rem 1.5rem", fontSize: "1rem", cursor: "pointer", borderRadius: "6px", border: "1px solid #ccc", background: "#f5f5f5" }}
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;
