import "dotenv/config";
import fs from "fs";

import { searchJobs } from "./tools/searchJobs";
import { classifyJob } from "./tools/classifyJob";

const seenFile = "./data/seenJobs.json";

async function run() {

  const seen = JSON.parse(fs.readFileSync(seenFile, "utf-8"));

  const jobs = await searchJobs();

  for (const job of jobs) {

    if (seen.includes(job.url)) continue;

    const text = job.title + "\n" + job.content;

    const result = await classifyJob(text);

    if (result === "SI") {

      console.log("\n🔥 NUEVA CONVOCATORIA:\n");
      console.log(job.title);
      console.log(job.url);

      seen.push(job.url);
    }
  }

  fs.writeFileSync(seenFile, JSON.stringify(seen, null, 2));
}

run();
