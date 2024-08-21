import path from "path";
import { Logger } from "@rx-lab/common";
import { Core } from "@rx-lab/core";

(async () => {
  try {
    const core = await Core.Compile({
      rootDir: path.join(__dirname, "src"),
      destinationDir: path.join(__dirname, ".rx-lab"),
    });
    await core.init();
    console.log("Bot is running");
  } catch (err: any) {
    // log error trace
    console.error(err.stack);
    Logger.log(err.toString(), "red");
    process.exit(1);
  }
})();
