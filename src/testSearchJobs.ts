import "dotenv/config";
import { searchJobs } from "./tools/searchJobs";

async function run() {

  const jobs = await searchJobs();

  console.log(jobs);
}

run();
