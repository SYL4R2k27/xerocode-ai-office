/**
 * ErrorBoundary — root-level safety net.
 * Catches React render errors, shows recovery UI, logs to console (+ Sentry если есть).
 */
import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface Props {
  children: ReactNode;
  /** Опционально — fallback UI вместо встроенного */
  fallback?: ReactNode;
  /** Имя секции для логов */
  name?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const name = this.props.name || "root";
    console.error(`[ErrorBoundary:${name}]`, error, errorInfo);
    this.setState({ errorInfo });
    // Sentry — если глобально подключен
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, { extra: { boundary: name, componentStack: errorInfo.componentStack } });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "var(--bg-base, #0A0A0F)", color: "var(--text-primary, #fff)" }}
      >
        <div className="w-full max-w-md text-center space-y-5">
          <div
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
            style={{ backgroundColor: "color-mix(in srgb, #ef4444 15%, transparent)" }}
          >
            <AlertTriangle size={32} color="#ef4444" />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: 8 }}>
              Что-то пошло не так
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-tertiary, #888)", lineHeight: 1.5 }}>
              Произошла непредвиденная ошибка. Попробуй вернуться на главную или перезагрузить страницу.
            </p>
          </div>
          {this.state.error && (
            <details
              className="text-left rounded-lg p-3 cursor-pointer"
              style={{ backgroundColor: "var(--bg-elevated, #1a1a22)", fontSize: "11px", fontFamily: "monospace" }}
            >
              <summary style={{ color: "var(--text-secondary, #aaa)", cursor: "pointer" }}>
                Технические детали
              </summary>
              <pre style={{ whiteSpace: "pre-wrap", marginTop: 8, color: "#ef4444" }}>
                {this.state.error.message}
              </pre>
              {this.state.errorInfo && (
                <pre style={{ whiteSpace: "pre-wrap", marginTop: 8, color: "var(--text-tertiary, #888)", maxHeight: 200, overflow: "auto" }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          )}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: "var(--bg-elevated, #1a1a22)", color: "var(--text-primary, #fff)" }}
            >
              <RotateCcw size={14} /> Попробовать снова
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:brightness-110"
              style={{ backgroundColor: "var(--accent-blue, #3b82f6)", color: "#fff" }}
            >
              Перезагрузить
            </button>
          </div>
        </div>
      </div>
    );
  }
}
