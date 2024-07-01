import React from "react";

export enum ContainerType {
  ROOT = "ROOT",
}

export interface Container {
  children: React.ReactElement[];
  _rootContainer?: React.ReactElement;
  type: string;
}
