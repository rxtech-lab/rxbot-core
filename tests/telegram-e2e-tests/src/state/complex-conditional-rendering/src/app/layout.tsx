"use client";
import { useState } from "@rx-lab/storage";
import dayjs from "dayjs";
import * as React from "react";
import { createContext, useContext, useMemo } from "react";

type Props = {
  children: React.ReactNode;
  start?: string;
  end?: string;
};

interface Context {
  startTime: string;
  setStartTime: (value: string) => void;
  isStartValid: boolean;
  endTime: string;
  setEndTime: (value: string) => void;
  isEndValid: boolean;
}

const Context = createContext<Context>({} as any);

export function ContextProvider(props: Props) {
  const [startValue, setStart] = useState<string>(
    `start-datetime-pad`,
    props.start ?? "****-**-** **:**",
  );

  const [endValue, setEnd] = useState<string>(
    `end-datetime-pad`,
    props.end ?? "****-**-** **:**",
  );

  const isStartValid = useMemo(() => {
    return !startValue.includes("*") && dayjs(startValue).isValid();
  }, [startValue]);

  const isEndValid = useMemo(() => {
    return !endValue.includes("*") && dayjs(endValue).isValid();
  }, [endValue]);

  const value: Context = {
    startTime: startValue,
    setStartTime: setStart,
    isStartValid,
    endTime: endValue,
    setEndTime: setEnd,
    isEndValid,
  };

  return <Context.Provider value={value}>{props.children}</Context.Provider>;
}

export function useStartProvider() {
  return useContext(Context);
}
