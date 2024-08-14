import React from "react";
import { ReactCommandProps } from "./Command";

export interface ReactCommandButtonProps extends ReactCommandProps {
  /**
   * Determines whether to render a new message or update the current message when the command is executed.
   *
   * @default false
   *
   * Use cases:
   * - Set to `false` for pagination buttons to update the current message.
   * - Set to `true` for redirect buttons to render a new message.
   */
  renderNewMessage?: boolean;
}

/**
 * CommandButton renders a button that executes a specified command when clicked.
 *
 * The button can either update the current message or render a new one based on the `renderNewMessage` prop.
 * If no `command` prop is provided, the `children` prop will be used as the command.
 *
 * @param children - The content to be displayed inside the button
 * @param command
 * @param renderNewMessage - Determines whether to render a new message or update the current message when the command is executed
 * @returns A command button React element
 */
export function CommandButton({
  children,
  command,
  renderNewMessage = false,
}: ReactCommandButtonProps) {
  return (
    //@ts-ignore
    <command
      command={command ?? children}
      variant="button"
      renderNewMessage={renderNewMessage}
    >
      {children}
      {/*//@ts-ignore*/}
    </command>
  );
}
