import { RouterProvider } from "@rx-lab/router";
import { StorageProvider } from "@rx-lab/storage";
import type React from "react";

interface Props {
  element: any;
  storage: any;
  chatroomInfo: any;
  message: any;
}

export function WrappedElement(props: Props) {
  const Element = props.element;
  return (
    <RouterProvider chatroomInfo={props.chatroomInfo} message={props.message}>
      <StorageProvider client={props.storage}>
        <Element />
      </StorageProvider>
    </RouterProvider>
  );
}
