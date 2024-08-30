import { CommandButton } from "@rx-lab/core";

enum BotStatusEnum {
  Off = "off",
  Running = "running",
  Stopping = "stopping",
}

export default function Page() {
  function getBotActions(id: string, status: BotStatusEnum) {
    if (status === BotStatusEnum.Off) {
      return (
        <div>
          <CommandButton command={`/bot/${id}/start`}>Start</CommandButton>
        </div>
      );
    }

    if (status === BotStatusEnum.Running) {
      return (
        <>
          <div>
            <CommandButton command={`/bot/${id}/stop`}>Stop</CommandButton>
          </div>
          <div>
            <CommandButton command={`/bot/${id}/cancel`}>Cancel</CommandButton>
          </div>
        </>
      );
    }

    if (status === BotStatusEnum.Stopping) {
      return (
        <div>
          <CommandButton command={`/bot/${id}/cancel`}>Cancel</CommandButton>
        </div>
      );
    }
  }

  return (
    <div>
      <span>This is a page with function inside component</span>
      {getBotActions("1", BotStatusEnum.Off)}
      {getBotActions("2", BotStatusEnum.Running)}
      {getBotActions("3", BotStatusEnum.Stopping)}
    </div>
  );
}
