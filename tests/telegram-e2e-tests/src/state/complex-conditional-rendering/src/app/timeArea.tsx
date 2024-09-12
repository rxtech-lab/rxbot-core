import { useState } from "@rx-lab/storage";
import dayjs from "dayjs";
// @flow
import { Mode } from "./config";
import { useStartProvider } from "./layout";
import { DateTimeNumberPad } from "./numpad";

type Props = {
  id: string;
  onModeChange: (mode: Mode) => void;
  timeMode: "start" | "end";
};

export function TimeArea({ onModeChange, timeMode }: Props) {
  const { startTime, setStartTime, endTime, setEndTime } = useStartProvider();
  const [error, setError] = useState(`start-error`, "");

  return (
    <div>
      <h1>
        Current {timeMode} time (24h):{" "}
        {timeMode === "start" ? startTime : endTime}
      </h1>
      <hr />
      {error && <h1>({error})</h1>}
      <hr />
      <DateTimeNumberPad
        onChange={(value) => {
          if (timeMode === "start") {
            setStartTime(value);
          }
          if (timeMode === "end") {
            setEndTime(value);
          }
        }}
        value={startTime}
      />
      <div>
        <button
          key={"save"}
          onClick={() => {
            if (dayjs(timeMode === "start" ? startTime : endTime).isValid()) {
              onModeChange(Mode.Default);
            } else {
              setError("Invalid date time format");
            }
          }}
        >
          Save
        </button>
      </div>
      <div>
        <button
          key={"cancel"}
          onClick={() => {
            onModeChange(Mode.Default);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
