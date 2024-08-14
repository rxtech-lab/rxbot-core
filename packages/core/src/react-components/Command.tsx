import React from "react";

export interface ReactCommandProps {
  /**
   * The content of the command.
   */
  children: string;
  /**
   * The command to run. Optional, if not provided, the children will be used as the command.
   */
  command?: string;
}

/**
 * Command component is used to render a command in the bot.
 * @param children
 * @param command
 * @constructor
 */
export function Command({ children, command }: ReactCommandProps) {
  //@ts-ignore
  return <command command={command ?? children}>{children}</command>;
}
