"use client";
import { useState } from "@rx-lab/storage";
import { Dayjs } from "dayjs";
import { useStartProvider } from "./layout";
import { TimeArea } from "./timeArea";

type Props = {
  id: string;
  userId: any;
  defaultStart?: Dayjs;
  defaultEnd?: Dayjs;
};

export enum Mode {
  ConfigStart = 0,
  ConfigEnd = 1,
  Default = 2,
}

export function ConfigurationArea(props: Props) {
  const [mode, setMode] = useState(`${props.id}-mode`, Mode.Default);
  const { startTime, isStartValid, isEndValid, endTime } = useStartProvider();

  if (mode === Mode.ConfigStart) {
    return (
      <TimeArea
        id={props.id}
        onModeChange={(mode) => setMode(mode)}
        timeMode={"start"}
      />
    );
  }

  if (mode === Mode.ConfigEnd) {
    return (
      <TimeArea
        id={props.id}
        onModeChange={(mode) => setMode(mode)}
        timeMode={"end"}
      />
    );
  }

  return (
    <div>
      <div>
        <h1>In order to start the bot, please edit start time and end time</h1>
        <hr />
        <div>
          <button
            key={"start"}
            onClick={() => {
              setMode(Mode.ConfigStart);
            }}
          >
            Start Time: {isStartValid && startTime}
          </button>
        </div>
        <div>
          <button
            key={"end"}
            onClick={() => {
              setMode(Mode.ConfigEnd);
            }}
          >
            End Time: {isEndValid && endTime}
          </button>
        </div>
        {isStartValid && isEndValid && (
          <div>
            <button key={"save"} onClick={() => {}}>
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
