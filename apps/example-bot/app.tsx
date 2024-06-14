import React from "react";

export function App() {
  const [state, setState] = React.useState(0);

  return (
    <div>
      <h1>Welcome to the Telegram Bot!</h1>
      <hr />
      <p>Choose an option</p>
      <hr />
      <p>Current state: {state}</p>
      <menu>
        <button
          onClick={() => {
            console.log("clicked +1");
            setState(state + 1);
          }}
        >
          +1
        </button>
        <button
          onClick={() => {
            setState(state - 1);
          }}
        >
          -1
        </button>
      </menu>
    </div>
  );
}
