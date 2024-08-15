import { REACT_CLIENT_COMPONENT_TYPE } from "@rx-lab/common";
import * as React from "react";

export function Child() {
  const [state, setState] = React.useState(0);
  return (
    <div>
      This is a child component
      <AnotherChild />
    </div>
  );
}

export function AnotherChild() {
  return <div>This is another child component</div>;
}

Child.$$typeof = Symbol.for(REACT_CLIENT_COMPONENT_TYPE);

AnotherChild.$$typeof = Symbol.for(REACT_CLIENT_COMPONENT_TYPE);
