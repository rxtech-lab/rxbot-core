import { Api } from "@rx-lab/mock-telegram-client";
import { CLIProcessManager } from "./process-manager";

/**
 * Utility function to sleep for a given time
 * @param ms
 */
export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const PORT = 9000;

export const DEFAULT_RENDERING_WAIT_TIME = 800;

interface Options {
  cwd: string;
  chatroomId: number;
}

/**
 * Initialize the core, router, adapter and compiler
 * @param api
 * @param opts
 */
export const initializeDevServer = async (api: Api<any>, opts: Options) => {
  const processManager = new CLIProcessManager();
  processManager.on("stderr", (error: any) => {
    throw error;
  });
  await processManager.start("rxbot", ["dev"], {
    cwd: opts.cwd,
  });
  await sleep(1000);
  await api.reset.resetState();
  await api.chatroom.registerWebhookForChatroom(opts.chatroomId, {
    url: `http://localhost:3000/api/webhook`,
  });
  return {
    processManager,
  };
};
