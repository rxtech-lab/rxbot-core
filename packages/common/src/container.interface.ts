import React from "react";

export enum ContainerType {
  ROOT = "ROOT",
}

export interface Container {
  children: any[];
  _rootContainer?: React.ReactElement;
  type: string;
}
