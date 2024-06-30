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
        <div>
          <button
            key={"button1"}
            onClick={() => {
              console.log("clicked +1");
              setState(state + 1);
            }}
          >
            +1
          </button>
          <button
            key={"button2"}
            onClick={() => {
              setState(state - 1);
            }}
          >
            -1
          </button>
        </div>
        <div>
          <button
            key={"button3"}
            onClick={() => {
              setState(0);
            }}
          >
            Reset
          </button>
        </div>
      </menu>
    </div>
  );
}
