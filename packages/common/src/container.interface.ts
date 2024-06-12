import React from "react";

export interface Container {
  children: React.ReactElement[];
  _rootContainer?: React.ReactElement;
}
