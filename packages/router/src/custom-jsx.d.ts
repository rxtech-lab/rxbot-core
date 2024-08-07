// File: custom-jsx.d.ts

import React from "react";

interface SuspendableProps {
  shouldSuspend: boolean;
  children?: React.ReactNode;
}

// Extend JSX.IntrinsicElements to include the minimal 'suspendable'
declare global {
  namespace JSX {
    interface IntrinsicElements {
      suspendable: SuspendableProps;
    }
  }
}
