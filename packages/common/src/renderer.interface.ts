import React from "react";
import { Container } from "./container.interface";

export interface Renderer<T extends Container<any, any>> {
  init: (element: React.ReactElement) => Promise<void>;
  render: (container: T) => any;
}
