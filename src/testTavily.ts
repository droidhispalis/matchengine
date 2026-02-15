import { TavilyClient } from "tavily";
import "dotenv/config";

const tavily = new TavilyClient({
  apiKey: process.env.TAVILY_API_KEY!,
});

async function run() {

  const response = await tavily.search({
    query: "site:juntadeandalucia.es convocatoria discapacidad plazo solicitud",

    max_results: 5,
  });

  console.log(response);
}

run();
