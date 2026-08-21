import { Component, type ErrorInfo, type ReactNode } from 'react';
import { BidVaultLogo } from './ui';

/**
 * Catches render errors so one broken component does not blank the whole app.
 *
 * Until this existed, any error thrown during render — a null dereference in a screen, a
 * malformed response reaching a `.map()` — unmounted the entire React tree and left a white
 * page with nothing on it and no way back. That is a bad failure anywhere; on a project that
 * gets demonstrated live it is the worst one available.
 *
 * A class component on purpose: componentDidCatch and getDerivedStateFromError have no hook
 * equivalent, and React still has no function-component API for this.
 *
 * Deliberately NOT a replacement for handling errors where they happen. Screens that fetch
 * already distinguish "empty" from "failed" and say so — see BUG-16 and UX-12/13, which were
 * exactly the opposite mistake. This is the net under all of that, for the errors nobody
 * predicted.
 */

interface Props {
  children: ReactNode;
  /** Reported alongside the error so a log says which part of the tree failed. */
  area?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // The one place in the app that knows a render died. Console for now; this is the hook a
    // reporter would attach to.
    console.error(
      `[error-boundary]${this.props.area ? ` ${this.props.area}:` : ''}`,
      error,
      info.componentStack,
    );
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="min-h-screen bg-navy flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] bg-primary opacity-[0.06] rounded-full blur-[100px]" />

        <div className="relative z-10 text-center max-w-[520px] mx-auto">
          <div className="inline-flex items-center gap-2 mb-10 opacity-70">
            <BidVaultLogo size="md" to="" />
          </div>

          <h1 className="font-extrabold text-[24px] sm:text-[30px] text-white tracking-[-0.5px] leading-tight">
            Something went wrong on this page
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[rgba(255,255,255,0.5)] leading-[1.7] mt-3 mb-8">
            The rest of BidVault is fine — this screen hit an error it could not recover from.
            Your bids and account are unaffected.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* Clearing the error re-renders the same subtree. If the cause was transient — a
                bad response, a race — this recovers in place without losing the session. */}
            <button
              onClick={this.reset}
              className="bg-primary font-bold text-[14px] text-white px-6 py-3 rounded-md hover:bg-primary-dark transition-colors shadow-[0_8px_24px_rgba(208,2,27,0.35)]"
            >
              Try again
            </button>
            {/* A full load, not a client-side link: the router lives inside this boundary, so
                navigating would re-render the same broken tree. */}
            <a
              href="/"
              className="border border-[rgba(255,255,255,0.2)] font-bold text-[14px] text-[rgba(255,255,255,0.75)] px-6 py-3 rounded-md hover:border-white hover:text-white transition-all"
            >
              Go Home
            </a>
          </div>

          {/* The message only in development. In production it can carry internals a user
              should not see, and cannot act on either way. */}
          {import.meta.env.DEV && (
            <pre className="mt-8 text-left text-[11px] text-[rgba(255,255,255,0.4)] bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-md p-3 overflow-auto max-h-[160px]">
              {error.message}
            </pre>
          )}
        </div>
      </main>
    );
  }
}
