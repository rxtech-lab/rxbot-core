interface SuspendableProps {
  children: any;
  shouldSuspend: boolean;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      suspendable: SuspendableProps;
    }
  }
}
