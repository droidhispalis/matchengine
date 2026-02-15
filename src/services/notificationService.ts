import nodemailer from 'nodemailer';
import TelegramBot from 'node-telegram-bot-api';
import { log } from '../utils/logger.js';

// Configuración Email
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Configuración Telegram
let telegramBot: TelegramBot | null = null;
if (process.env.TELEGRAM_BOT_TOKEN) {
  telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
}

export interface Opportunity {
  id: number;
  title: string;
  organism: string;
  specialty?: string;
  application_deadline?: string;
  disability_quota: boolean;
  autonomous_region?: string;
  syllabus_url?: string;
}

export async function sendEmailNotification(
  to: string,
  subject: string,
  opportunities: Opportunity[]
): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    log('❌ SMTP no configurado, saltando notificación por email');
    return false;
  }

  try {
    const htmlContent = generateEmailHTML(opportunities);
    
    await emailTransporter.sendMail({
      from: `"MatchEngine" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent
    });

    log(`✅ Email enviado a ${to}`);
    return true;
  } catch (error: any) {
    log(`❌ Error enviando email: ${error.message}`);
    return false;
  }
}

export async function sendTelegramNotification(
  chatId: string,
  opportunities: Opportunity[]
): Promise<boolean> {
  if (!telegramBot) {
    log('❌ Telegram bot no configurado, saltando notificación');
    return false;
  }

  try {
    const message = generateTelegramMessage(opportunities);
    
    await telegramBot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    
    log(`✅ Telegram enviado a chat ${chatId}`);
    return true;
  } catch (error: any) {
    log(`❌ Error enviando Telegram: ${error.message}`);
    return false;
  }
}

function generateEmailHTML(opportunities: Opportunity[]): string {
  const oppRows = opportunities.map(opp => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${opp.title || 'Sin título'}</strong><br>
        <span style="color: #666;">${opp.organism || ''}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
        ${opp.disability_quota ? '✅ Sí' : '❌ No'}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        ${opp.application_deadline ? new Date(opp.application_deadline).toLocaleDateString('es-ES') : 'N/A'}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        ${opp.autonomous_region || 'N/A'}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; }
        table { width: 100%; border-collapse: collapse; background: white; }
        th { background: #667eea; color: white; padding: 12px; text-align: left; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Nuevas Oportunidades - MatchEngine</h1>
          <p>Se han encontrado ${opportunities.length} nuevas oportunidades que coinciden con tu búsqueda</p>
        </div>
        <div class="content">
          <table>
            <thead>
              <tr>
                <th>Oportunidad</th>
                <th style="text-align: center;">Cupo Discapacidad</th>
                <th>Plazo</th>
                <th>Región</th>
              </tr>
            </thead>
            <tbody>
              ${oppRows}
            </tbody>
          </table>
        </div>
        <div class="footer">
          <p>MatchEngine - Sistema Automático de Búsqueda de Oposiciones</p>
          <p style="font-size: 0.9em;">Para gestionar tus notificaciones, accede al dashboard</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateTelegramMessage(opportunities: Opportunity[]): string {
  let message = `🎯 <b>Nuevas Oportunidades</b>\n\n`;
  message += `Se encontraron <b>${opportunities.length}</b> oportunidades:\n\n`;
  
  opportunities.slice(0, 10).forEach((opp, index) => {
    message += `<b>${index + 1}. ${opp.title || 'Sin título'}</b>\n`;
    message += `   🏛 ${opp.organism || 'N/A'}\n`;
    message += `   ♿ Cupo: ${opp.disability_quota ? 'Sí' : 'No'}\n`;
    if (opp.application_deadline) {
      message += `   📅 Plazo: ${new Date(opp.application_deadline).toLocaleDateString('es-ES')}\n`;
    }
    if (opp.autonomous_region) {
      message += `   📍 ${opp.autonomous_region}\n`;
    }
    message += '\n';
  });

  if (opportunities.length > 10) {
    message += `\n... y ${opportunities.length - 10} más. Revisa el dashboard para ver todas.`;
  }

  return message;
}

export async function notifyNewOpportunities(
  userId: number,
  userEmail: string,
  userName: string,
  notificationSettings: any,
  opportunities: Opportunity[]
): Promise<void> {
  if (opportunities.length === 0) return;

  log(`📧 Enviando notificaciones para ${opportunities.length} oportunidades a ${userName}`);

  // Email
  if (notificationSettings.email_enabled && notificationSettings.email_address) {
    await sendEmailNotification(
      notificationSettings.email_address,
      `MatchEngine: ${opportunities.length} nuevas oportunidades`,
      opportunities
    );
  }

  // Telegram
  if (notificationSettings.telegram_enabled && notificationSettings.telegram_chat_id) {
    await sendTelegramNotification(
      notificationSettings.telegram_chat_id,
      opportunities
    );
  }
}
