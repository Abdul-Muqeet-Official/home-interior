"use client";

/**
 * components/ui/MediaErrorBoundary.tsx
 *
 * A last-resort guard around a single media element.
 *
 * `next/image` validates its `src` during render and throws for an unusable
 * value. A thrown render error inside React unmounts the whole tree, which would
 * replace an entire VIP category page with the route-level error screen because
 * of one bad row. This boundary contains that failure to the individual frame:
 * the rest of the page keeps rendering and stays interactive.
 *
 * The fallback is neutral (surface tone, no broken-image icon, no raw path) so a
 * single bad asset can never look like a layout defect.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Rendered in place of the media when rendering throws. */
  fallback?: ReactNode;
}

interface State {
  failed: boolean;
}

export default class MediaErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Kept as a real console error: silencing it would hide a genuine data bug.
    console.error("[home-interior] media render failed:", error.message, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        this.props.fallback ?? (
          <div aria-hidden="true" className="h-full w-full bg-surface" />
        )
      );
    }
    return this.props.children;
  }
}