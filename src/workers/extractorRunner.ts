import { getJobsToExtract, markJobExtracted } from "../repositories/jobRepository.js";
import { insertOpportunity } from "../repositories/opportunityRepository.js";
import { extractOpportunity } from "../tools/extractOpportunity.js";

async function runExtractor() {
    console.log("🧠 Extractor running...");

    const jobs = await getJobsToExtract(10);

    console.log(`📋 Jobs pendientes de extraer: ${jobs.length}`);

    if (!jobs.length) {
        console.log("✅ Nada que extraer.");
        return;
    }

    let extracted = 0;
    let failed = 0;

    for (const job of jobs) {
        try {
            console.log(`\n🔍 Extrayendo: ${job.title}`);

            const data = await extractOpportunity(job);

            // 🚨 SI GPT NO DEVUELVE NADA VÁLIDO
            if (!data || typeof data !== 'object') {
                console.log(`⚠️ Sin datos válidos para job_id=${job.id}`);
                await markJobExtracted(job.id, false);
                failed++;
                continue;
            }

            // 🔥 INSERTAR OPPORTUNITY
            await insertOpportunity(job.id, data);
            await markJobExtracted(job.id, true);

            console.log(`✅ Extraído: ${data.title || job.title}`);
            extracted++;

        } catch (err: any) {
            console.error(`❌ ERROR en job_id=${job.id}:`, err.message);
            await markJobExtracted(job.id, false);
            failed++;
        }
    }

    console.log(`\n✔ Ciclo terminado: ${extracted} extraídos, ${failed} fallidos`);
}

runExtractor();
