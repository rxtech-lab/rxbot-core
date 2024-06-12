import React from "react";
import { Container } from "./container.interface";

export interface Renderer<T extends Container> {
  init: () => Promise<void>;
  render: (element: React.ReactElement, container: T) => void;
  onRendered: (container: T) => Promise<void>;
}
