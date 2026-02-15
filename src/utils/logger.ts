import fs from "fs";

const LOG_PATH = "./data/agent.log";

export function log(message: string) {

  const line = `${new Date().toISOString()} - ${message}\n`;

  fs.appendFileSync(LOG_PATH, line);

  console.log(message);
}
