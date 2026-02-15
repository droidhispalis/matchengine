import { runAgent } from "./agent/agent.js";

const response = await runAgent("Tell me the weather in Madrid");

console.log("AGENT RESPONSE:");
console.log(response);
