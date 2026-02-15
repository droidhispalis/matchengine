import { getUnclassifiedJobs, markJobClassified } from "../repositories/jobRepository.js";
import { classifyJob } from "../tools/classifyJob.js";

async function runClassifier() {
    console.log("🧠 Classifier running...");

    const jobs = await getUnclassifiedJobs(20);

    console.log(`📋 Jobs pendientes de clasificar: ${jobs.length}`);

    if (!jobs.length) {
        console.log("✅ Nada que clasificar.");
        return;
    }

    let relevant = 0;
    let discarded = 0;

    for (const job of jobs) {
        try {
            const text = `${job.title}\n${job.snippet}`;
            const result = await classifyJob(text);

            const isRelevant = result.toUpperCase().includes("SI");

            await markJobClassified(job.id, isRelevant);

            if (isRelevant) {
                console.log(`✅ RELEVANTE -> ${job.title}`);
                relevant++;
            } else {
                console.log(`❌ DESCARTADO -> ${job.title}`);
                discarded++;
            }

        } catch (err: any) {
            console.error(`❌ ERROR clasificando job_id=${job.id}:`, err.message);
        }
    }

    console.log(`\n✔ Ciclo terminado: ${relevant} relevantes, ${discarded} descartados`);
}

runClassifier();
