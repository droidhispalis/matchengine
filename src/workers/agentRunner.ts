import { searchJobs } from "../tools/searchJobs.js";
import { insertJob } from "../repositories/jobRepository.js";
import { log } from "../utils/logger.js";

async function runAgent() {

    console.log("🚀 Agent running...");

    const jobs = await searchJobs();

    console.log(`Candidatos encontrados: ${jobs.length}`);

    let inserted = 0;

    for (const job of jobs) {

        const isNew = await insertJob(job);

        if (isNew) {
            inserted++;
            log(`🆕 Nuevo job guardado: ${job.title}`);
        }
    }

    console.log(`✅ Nuevos insertados: ${inserted}`);
    console.log("😴 Ciclo terminado.\n");
}

runAgent();
