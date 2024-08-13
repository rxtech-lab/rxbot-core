import { RouteMetadata } from "@rx-lab/common";
import { useRouter } from "@rx-lab/router";
import { useState } from "@rx-lab/storage";
import React from "react";

export const metadata: RouteMetadata = {
  title: "Counter",
  description: "This is a counter",
  includeInMenu: true,
};

export default async function Page() {
  const [state, setState] = useState("counter", 0);
  const { chatroomInfo } = useRouter();

  return (
    <div>
      <h1>Welcome to the Telegram Bot!</h1>
      <h1>ChatroomInfo: {chatroomInfo.messageId}</h1>
      <hr />
      <p>Choose an option</p>
      <hr />
      <p>Current state: {state}</p>
      <menu>
        <div>
          <button
            key={"button1"}
            onClick={() => {
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
