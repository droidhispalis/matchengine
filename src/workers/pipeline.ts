import "dotenv/config";
import { searchJobs } from "../tools/searchJobs.js";
import { insertJob, getJobStats } from "../repositories/jobRepository.js";
import { getUnclassifiedJobs, markJobClassified } from "../repositories/jobRepository.js";
import { getJobsToExtract, markJobExtracted } from "../repositories/jobRepository.js";
import { insertOpportunity, getOpportunityStats } from "../repositories/opportunityRepository.js";
import { classifyJob } from "../tools/classifyJob.js";
import { extractOpportunity } from "../tools/extractOpportunity.js";

// ============================================
// STAGE 1: SEARCH & INSERT
// ============================================
async function runSearchStage() {
    console.log("\n🔍 ============ STAGE 1: SEARCH ============");
    
    const jobs = await searchJobs();
    console.log(`📡 Encontrados: ${jobs.length} candidatos`);

    let inserted = 0;
    for (const job of jobs) {
        const isNew = await insertJob(job);
        if (isNew) inserted++;
    }

    console.log(`✅ Nuevos insertados: ${inserted}`);
    return inserted;
}

// ============================================
// STAGE 2: CLASSIFY
// ============================================
async function runClassifyStage(limit: number = 20) {
    console.log("\n🧠 ============ STAGE 2: CLASSIFY ============");

    const jobs = await getUnclassifiedJobs(limit);
    console.log(`📋 Pendientes de clasificar: ${jobs.length}`);

    if (!jobs.length) {
        console.log("✅ Nada que clasificar");
        return { relevant: 0, discarded: 0 };
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
                console.log(`✅ RELEVANTE -> ${job.title.substring(0, 60)}...`);
                relevant++;
            } else {
                console.log(`❌ DESCARTADO -> ${job.title.substring(0, 60)}...`);
                discarded++;
            }
        } catch (err: any) {
            console.error(`❌ ERROR job_id=${job.id}:`, err.message);
        }
    }

    console.log(`✔ Clasificados: ${relevant} relevantes, ${discarded} descartados`);
    return { relevant, discarded };
}

// ============================================
// STAGE 3: EXTRACT
// ============================================
async function runExtractStage(limit: number = 10) {
    console.log("\n🔬 ============ STAGE 3: EXTRACT ============");

    const jobs = await getJobsToExtract(limit);
    console.log(`📋 Pendientes de extraer: ${jobs.length}`);

    if (!jobs.length) {
        console.log("✅ Nada que extraer");
        return { extracted: 0, failed: 0 };
    }

    let extracted = 0;
    let failed = 0;

    for (const job of jobs) {
        try {
            console.log(`\n🔍 Extrayendo: ${job.title.substring(0, 60)}...`);

            const data = await extractOpportunity(job);

            if (!data || typeof data !== 'object') {
                console.log(`⚠️ Sin datos válidos`);
                await markJobExtracted(job.id, false);
                failed++;
                continue;
            }

            await insertOpportunity(job.id, data);
            await markJobExtracted(job.id, true);

            console.log(`✅ Extraído: ${data.title || job.title}`);
            extracted++;

        } catch (err: any) {
            console.error(`❌ ERROR job_id=${job.id}:`, err.message);
            await markJobExtracted(job.id, false);
            failed++;
        }
    }

    console.log(`✔ Extraídos: ${extracted} OK, ${failed} fallidos`);
    return { extracted, failed };
}

// ============================================
// SHOW STATS
// ============================================
async function showStats() {
    console.log("\n📊 ============ ESTADÍSTICAS ============");

    const jobStats = await getJobStats();
    console.log("\n📋 Jobs por estado:");
    jobStats.forEach((stat: any) => {
        console.log(`  ${stat.status}: ${stat.count}`);
    });

    const oppStats = await getOpportunityStats();
    console.log("\n💼 Opportunities:");
    console.log(`  Total: ${oppStats.total}`);
    console.log(`  Con cupo discapacidad: ${oppStats.with_disability_quota}`);
    console.log(`  Regiones: ${oppStats.regions}`);
}

// ============================================
// MAIN PIPELINE
// ============================================
async function runPipeline() {
    console.log("🚀 ============ MATCHENGINE PIPELINE ============");
    console.log(`⏰ Iniciado: ${new Date().toLocaleString()}`);

    try {
        // Stage 1: Search
        await runSearchStage();

        // Stage 2: Classify
        await runClassifyStage(20);

        // Stage 3: Extract
        await runExtractStage(10);

        // Show stats
        await showStats();

        console.log("\n✅ ============ PIPELINE COMPLETADO ============\n");

    } catch (err: any) {
        console.error("\n❌ ERROR EN PIPELINE:", err.message);
        process.exit(1);
    }
}

// Ejecutar
runPipeline();
