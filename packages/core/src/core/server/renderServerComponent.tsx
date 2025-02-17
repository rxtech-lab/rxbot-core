import {
  REACT_CLIENT_COMPONENT_TYPE,
  REACT_COMPONENT_TYPE,
} from "@rx-lab/common";
import React from "react";

/**
 * Check if the given object is a React element.
 * @param jsx
 */
export function isReactElement(jsx: any): boolean {
  if (!jsx) {
    return false;
  }

  if ("$$typeof" in jsx) {
    if (jsx.$$typeof.toString() === `Symbol(${REACT_COMPONENT_TYPE})`) {
      return true;
    }
  }
  return false;
}

/**
 * Check if the given object is a React client element.
 * @param jsx
 */
export function isReactClientElement(jsx: any): boolean {
  if (!jsx) {
    return false;
  }

  // check if jsx is type of Symbol
  if (typeof jsx === "symbol") {
    return false;
  }

  if ("type" in jsx) {
    if (typeof jsx.type !== "object") {
      return false;
    }
    if ("$$typeof" in jsx.type) {
      if (
        jsx.type.$$typeof.toString() ===
        `Symbol(${REACT_CLIENT_COMPONENT_TYPE})`
      ) {
        return true;
      }
    }
  }

  if ("$$typeof" in jsx) {
    if (jsx.$$typeof.toString() === `Symbol(${REACT_CLIENT_COMPONENT_TYPE})`) {
      return true;
    }
  }

  return false;
}

/**
 * Render the server component.
 * @param jsx
 * @param props
 * @param onAsyncServerComponent Callback function to handle async server component.
 */
export async function renderServerComponent(
  jsx: any,
  props: any,
  onAsyncServerComponent?: (jsx: any) => Promise<void>,
): Promise<any> {
  return renderServerComponentHelper(true, jsx, props, onAsyncServerComponent);
}

async function renderServerComponentHelper(
  isRoot: boolean,
  jsx: any,
  props: any,
  onAsyncServerComponent?: (jsx: any) => Promise<void>,
): Promise<any> {
  if (!jsx) {
    return null;
  }

  if (["string", "number", "boolean"].includes(typeof jsx)) {
    return jsx;
  }

  if (Array.isArray(jsx)) {
    return await Promise.all(
      jsx.map((element) =>
        renderServerComponentHelper(
          false,
          element,
          props,
          onAsyncServerComponent,
        ),
      ),
    );
  }

  // if the root element is a client component, return it as is
  if (isReactClientElement(jsx)) {
    const Component = jsx;
    let clientProps = jsx.props;
    if (isRoot) {
      clientProps = { ...clientProps, ...props };
    }
    return React.createElement(Component, clientProps);
  }

  if (typeof jsx === "object") {
    if (isReactElement(jsx)) {
      if (typeof jsx.type === "string") {
        let jsxProps = jsx.props;
        if (isRoot) {
          jsxProps = { ...props, ...jsxProps };
        }

        return {
          ...jsx,
          props: {
            ...jsxProps,
            ...(await renderServerComponentHelper(
              false,
              jsx.props,
              props,
              onAsyncServerComponent,
            )),
          },
        };
      }

      if (typeof jsx.type === "function") {
        if (isReactClientElement(jsx.type)) {
          return jsx;
        }
        const Component = await jsx.type;
        let jsxProps = jsx.props;
        if (isRoot) {
          jsxProps = { ...props, ...jsxProps };
        }

        const componentFunc = Component(jsxProps);
        // check if component function is a promise
        if (componentFunc instanceof Promise) {
          onAsyncServerComponent?.(jsx);
        }

        const component = await componentFunc;
        return await renderServerComponentHelper(
          false,
          component,
          jsxProps,
          onAsyncServerComponent,
        );
      }
    }

    const entries = Object.entries(jsx);
    const processedEntries = await Promise.all(
      entries.map(async ([key, value]) => {
        return [
          key,
          await renderServerComponentHelper(
            false,
            value,
            props,
            onAsyncServerComponent,
          ),
        ];
      }),
    );

    return Object.fromEntries(processedEntries);
  }

  // render server component
  if (typeof jsx !== "function") {
    return jsx;
  }
  const result = await renderServerComponentHelper(
    false,
    await jsx(props),
    props,
  );
  if (!result) {
    throw new Error(`Invalid element: ${jsx}`);
  }

  let jsxProps = result.props;
  if (isRoot) {
    jsxProps = { ...props, ...jsxProps };
  }
  return {
    ...result,
    props: jsxProps,
  };
}
