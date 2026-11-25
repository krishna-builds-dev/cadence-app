import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Cadence Unhandled Component Exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetCache = () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
    } catch {}
    window.location.hash = '';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121317] text-[#e3e2e8] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#1a1b20] border border-[#292a2e] shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#ff5449]/15 border border-[#ff5449]/30 text-[#ff5449] flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(255,84,73,0.25)]">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>

            <div className="space-y-2">
              <h2 className="font-space font-bold text-xl text-[#e3e2e8]">
                Something went wrong
              </h2>
              <p className="text-xs text-[#958ea0] leading-relaxed">
                Cadence encountered an unexpected runtime error. Your clinical and client data is safe.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-[#0d0e12] border border-[#292a2e] font-mono text-[11px] text-[#ffdad2] text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-[#ffb4a3] text-[#3a0900] hover:bg-[#ffdad2] font-space font-bold text-xs transition-all cursor-pointer shadow-md"
              >
                Reload Workspace
              </button>
              <button
                type="button"
                onClick={this.handleResetCache}
                className="py-3 px-4 rounded-xl bg-[#292a2e] hover:bg-[#343439] text-[#cbc3d7] font-space font-semibold text-xs transition-colors cursor-pointer border border-[#36343b]"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
