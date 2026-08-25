import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import cron from 'node-cron';

// Configuração do transportador de e-mail (SMTP)
// Você precisará configurar essas variáveis de ambiente no seu servidor de produção
// ou no arquivo .env para desenvolvimento local.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    // Se não houver usuário SMTP configurado, avisamos no console e não tentamos enviar
    // para evitar travamentos no servidor de desenvolvimento.
    if (!process.env.SMTP_USER) {
      console.warn(`[E-mail Simulado] Para: ${to} | Assunto: ${subject}`);
      console.warn('Configure SMTP_USER e SMTP_PASS no .env para envio real.');
      return false;
    }

    const info = await transporter.sendMail({
      from: '"Alerta Criminal" <noreply@alertacriminal.com>',
      to,
      subject,
      html,
    });
    console.log("E-mail enviado: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Erro ao enviar e-mail: ", error);
    return false;
  }
}

// Inicia o agendador de tarefas (Cron Job)
export function startEmailCronJob() {
  console.log("Iniciando serviço de agendamento de e-mails...");
  
  // Agenda para rodar todo Domingo às 08:00 da manhã
  // Formato cron: 'minuto hora dia_do_mes mes dia_da_semana'
  cron.schedule('0 8 * * 0', async () => {
    console.log("Executando job de resumo semanal de e-mails...");
    try {
      const db = admin.firestore();
      
      // Busca relatórios da última semana
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentReportsSnapshot = await db.collection('reports')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(oneWeekAgo))
        .get();
        
      const totalReports = recentReportsSnapshot.size;

      // Busca todos os usuários
      const usersSnapshot = await db.collection('users').get();

      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        
        // Verifica se o usuário ativou a notificação por e-mail
        if (userData.notificationSettings?.email && userData.email) {
          const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e293b;">Resumo Semanal - Alerta Criminal</h2>
              <p>Olá <strong>${userData.name}</strong>,</p>
              <p>Aqui está o seu resumo semanal de segurança da sua região.</p>
              <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 16px;">Na última semana, tivemos <strong>${totalReports}</strong> novos alertas registrados na plataforma.</p>
              </div>
              <p>Acesse o aplicativo para ver o mapa atualizado e se manter seguro.</p>
              <br/>
              <p style="color: #64748b; font-size: 14px;">Equipe Alerta Criminal</p>
            </div>
          `;
          
          await sendEmail(userData.email, 'Seu Resumo Semanal de Segurança', htmlContent);
        }
      }
    } catch (error) {
      console.error("Erro no job de e-mail semanal: ", error);
    }
  });
}
