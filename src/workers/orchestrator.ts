import "dotenv/config";
import { getActiveSearchConfigs, updateLastRun } from "../repositories/searchConfigRepository.js";
import { searchJobs } from "../tools/searchJobs.js";
import { insertJob } from "../repositories/jobRepository.js";
import { getUnclassifiedJobs, markJobClassified } from "../repositories/jobRepository.js";
import { getJobsToExtract, markJobExtracted } from "../repositories/jobRepository.js";
import { classifyJob } from "../tools/classifyJob.js";
import { extractOpportunity } from "../tools/extractOpportunity.js";
import { insertOpportunity } from "../repositories/opportunityRepository.js";
import { getNotificationSettings } from "../repositories/notificationRepository.js";
import { notifyNewOpportunities } from "../services/notificationService.js";
import { triggerWebhooks, WEBHOOK_EVENTS } from "../services/webhookService.js";

// ============================================
// ORCHESTRATOR - Ejecuta pipeline por usuario
// ============================================

async function runPipelineForConfig(config: any) {
  console.log(`\n🔄 Ejecutando pipeline para: ${config.name} (User: ${config.user_email})`);

  try {
    // STAGE 1: SEARCH & INSERT
    console.log("  📡 Stage 1: Buscando trabajos...");
    const jobs = await searchJobs();
    let inserted = 0;

    for (const job of jobs) {
      const isNew = await insertJob(job, config.user_id, config.id);
      if (isNew) inserted++;
    }
    console.log(`  ✅ ${inserted} nuevos trabajos insertados`);

    // STAGE 2: CLASSIFY
    console.log("  🧠 Stage 2: Clasificando trabajos...");
    const unclassified = await getUnclassifiedJobs(20, config.user_id, config.id);
    let relevant = 0;

    for (const job of unclassified) {
      try {
        const text = `${job.title}\n${job.snippet}`;
        const result = await classifyJob(text);
        const isRelevant = result.toUpperCase().includes("SI");
        await markJobClassified(job.id, isRelevant);
        if (isRelevant) relevant++;
      } catch (err) {
        console.error(`    Error clasificando job ${job.id}`);
      }
    }
    console.log(`  ✅ ${relevant} trabajos relevantes de ${unclassified.length}`);

    // STAGE 3: EXTRACT
    console.log("  🔬 Stage 3: Extrayendo datos...");
    const toExtract = await getJobsToExtract(10, config.user_id, config.id);
    let extracted = 0;
    const newOpportunities: any[] = [];

    for (const job of toExtract) {
      try {
        const data = await extractOpportunity(job);
        if (!data) {
          await markJobExtracted(job.id, false);
          continue;
        }
        const oppId = await insertOpportunity(job.id, data);
        await markJobExtracted(job.id, true);
        extracted++;
        
        // Guardar para notificación
        newOpportunities.push({
          id: oppId,
          title: data.title,
          organism: data.organism,
          specialty: data.specialty,
          application_deadline: data.application_deadline,
          disability_quota: data.disability_quota,
          autonomous_region: data.autonomous_region,
          syllabus_url: data.syllabus_url
        });
      } catch (err) {
        console.error(`    Error extrayendo job ${job.id}`);
        await markJobExtracted(job.id, false);
      }
    }
    console.log(`  ✅ ${extracted} oportunidades extraídas de ${toExtract.length}`);

    // STAGE 4: NOTIFY & WEBHOOKS
    if (newOpportunities.length > 0) {
      console.log("  📧 Stage 4: Enviando notificaciones y webhooks...");
      try {
        // Notificaciones
        const notificationSettings = await getNotificationSettings(config.user_id);
        if (notificationSettings && (notificationSettings.email_enabled || notificationSettings.telegram_enabled)) {
          await notifyNewOpportunities(
            config.user_id,
            config.user_email,
            config.user_name || config.user_email,
            notificationSettings,
            newOpportunities
          );
          console.log(`  ✅ Notificaciones enviadas`);
        } else {
          console.log(`  ⏭️ Notificaciones no configuradas`);
        }

        // Webhooks
        await triggerWebhooks(
          WEBHOOK_EVENTS.OPPORTUNITY_CREATED,
          config.user_id,
          {
            count: newOpportunities.length,
            opportunities: newOpportunities,
            search_config: {
              id: config.id,
              name: config.name
            }
          }
        );
        console.log(`  ✅ Webhooks disparados`);

      } catch (err: any) {
        console.error(`  ⚠️ Error enviando notificaciones/webhooks: ${err.message}`);
      }
    }

    // Actualizar last_run
    await updateLastRun(config.id);

  } catch (err: any) {
    console.error(`  ❌ Error en pipeline: ${err.message}`);
  }
}

async function orchestrate() {
  console.log("🚀 ============ ORCHESTRATOR INICIADO ============");
  console.log(`⏰ ${new Date().toLocaleString()}`);

  try {
    const configs = await getActiveSearchConfigs();
    console.log(`📋 Configuraciones activas: ${configs.length}`);

    if (configs.length === 0) {
      console.log("⚠️ No hay configuraciones activas para ejecutar");
      return;
    }

    for (const config of configs) {
      await runPipelineForConfig(config);
    }

    console.log("\n✅ ============ ORCHESTRATOR COMPLETADO ============\n");

  } catch (err: any) {
    console.error("❌ Error en orchestrator:", err.message);
  }
}

// Ejecutar inmediatamente
orchestrate();

// Ejecutar cada 5 minutos
setInterval(orchestrate, 5 * 60 * 1000);

console.log("⏰ Orchestrator en modo continuo (cada 5 minutos)");
