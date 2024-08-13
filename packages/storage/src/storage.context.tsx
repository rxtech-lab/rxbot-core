import { StorageInterface } from "@rx-lab/common";
import React from "react";

export interface StorageContextInterface {
  /**
   * Storage client.
   */
  client: StorageInterface;
}

export const StorageContext = React.createContext<StorageContextInterface>(
  {} as StorageContextInterface,
);

interface Props {
  client: StorageInterface;
  children: React.ReactNode;
}

export function StorageProvider({ children, client }: Props) {
  const value: StorageContextInterface = {
    client,
  };
  return (
    <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
  );
}
