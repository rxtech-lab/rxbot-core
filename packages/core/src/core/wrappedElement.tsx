import { CoreApi, ErrorPageProps, RenderedComponent } from "@rx-lab/common";
import { RouterProvider } from "@rx-lab/router";
import { StorageProvider } from "@rx-lab/storage";
import React from "react";
import { ErrorBoundary } from "../react-components/ErrorBoundary";
import { addKeyToChildren } from "./utils";

/**
 * Properties that will be passed to each rendered page component.
 * This is an internal interface and should not be used by the user.
 * Check `PageProps` for the properties that will be passed to the user.
 */
export interface WrappedElementProps {
  element: RenderedComponent;
  storage: any;
  chatroomInfo: any;
  message: any;
  api: CoreApi<any>;
  children?: any;
}

/**
 * Wrap component with RouterProvider and StorageProvider.
 * @param props
 * @constructor
 */
export function WrappedElement(
  props: WrappedElementProps & {
    errorPage: (error: ErrorPageProps) => React.ReactNode;
  },
) {
  return (
    <RouterProvider
      chatroomInfo={props.chatroomInfo}
      message={props.message}
      coreApi={props.api}
      pathParams={props.element.params}
      query={props.element.queryString}
      path={props.element.path}
    >
      <StorageProvider client={props.storage}>
        <ErrorBoundary fallback={props.errorPage}>
          {addKeyToChildren(props.children)}
        </ErrorBoundary>
      </StorageProvider>
    </RouterProvider>
  );
}
