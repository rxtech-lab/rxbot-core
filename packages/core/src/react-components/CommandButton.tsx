import React from "react";
import { ReactCommandProps } from "./Command";

export interface ReactCommandButtonProps extends ReactCommandProps {}

/**
 * Command button will render a button that will run the command when clicked.
 * @param children
 * @param command
 * @constructor
 */
export function CommandButton({ children, command }: ReactCommandButtonProps) {
  return (
    //@ts-ignore
    <command command={command ?? children} variant={"button"}>
      {children}
      {/*//@ts-ignore*/}
    </command>
  );
}
