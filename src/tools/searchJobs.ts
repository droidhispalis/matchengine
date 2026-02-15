import "dotenv/config";
import { TavilyClient } from "tavily";
import fs from "fs";

const tavily = new TavilyClient({
  apiKey: process.env.TAVILY_API_KEY!,
});

export async function searchJobs() {

  const config = JSON.parse(
    fs.readFileSync("./data/config.json", "utf-8")
  );

  let allResults: any[] = [];

  for (const query of config.queries) {

    const response = await tavily.search({
      query,
      max_results: config.maxResults,
    });

    allResults.push(...response.results);
  }

  // eliminar duplicados por URL
  const unique = Array.from(
    new Map(allResults.map(job => [job.url, job])).values()
  );

  return unique;
}
