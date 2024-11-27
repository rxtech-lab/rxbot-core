import { ErrorPageProps } from "@rx-lab/common";
import React from "react";

type Props = {
  fallback: (error: ErrorPageProps) => React.ReactNode;
  children: React.ReactNode;
};

type State = {
  error?: ErrorPageProps;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      error: undefined,
    };
  }

  static getDerivedStateFromError(error: Error) {
    console.error(error);
    return {
      error: {
        error,
        code: 500,
      },
    };
  }

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }

    return this.props.children;
  }
}
