import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import webPush from "web-push";
import { GoogleGenAI } from "@google/genai";
import twilio from "twilio";

// Inicializa Firebase Admin
admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Middleware
const verifyFirebaseToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Não autorizado. Token ausente ou inválido." });
    return;
  }
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    res.status(403).json({ error: "Acesso negado. Sessão inválida ou expirada." });
  }
};

app.get("/api/health", (req, res) => { res.json({ status: "ok" }); });

app.post("/api/chat", verifyFirebaseToken, async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    const { messages } = req.body;
    const contents = messages.map((m: any) => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: "Você é o Guardião Virtual, um assistente especializado em segurança pública e pessoal no Brasil. Dê dicas práticas, curtas e diretas sobre como evitar assaltos, rotas seguras, e o que fazer em emergências. Enfatize também a 'Zeladoria e Risco' (teoria das janelas quebradas): encoraje os usuários a reportar mato alto, falta de iluminação, buracos e enchentes, pois ambientes mal cuidados atraem o crime e geram acidentes. Seja empático, calmo e prestativo. Nunca recomende reagir a assaltos.",
      }
    });
    res.json({ text: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/push/subscribe', verifyFirebaseToken, async (req, res) => {
  try {
    const subscription = req.body;
    const uid = (req as any).user.uid;
    await admin.firestore().collection('users').doc(uid).collection('pushSubscriptions').add(subscription);
    res.status(201).json({ message: 'Inscrição realizada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao salvar inscrição' });
  }
});

app.post('/push/broadcast', verifyFirebaseToken, async (req, res) => {
  try {
    const { title, body, url, htmlContent } = req.body;
    const db = admin.firestore();
    const usersSnapshot = await db.collection('users').get();
    
    let sendCount = 0;
    let emailBccList: string[] = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const isEmailEnabled = userData.notificationSettings?.email ?? true;
      if (htmlContent && userData.email && !userData.email.endsWith('@anonymous.com') && isEmailEnabled && userData.termsAccepted === true) {
          emailBccList.push(userData.email);
      }
      const subsSnapshot = await userDoc.ref.collection('pushSubscriptions').get();
      for (const subDoc of subsSnapshot.docs) {
        const subscription = subDoc.data();
        try {
          const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'N23qQ3G1Z0mH3F3G1Z0mH3F3G1Z0mH3F3G1Z0mH3F3G1';
          if (privateVapidKey) {
             webPush.setVapidDetails('mailto:viciowins@gmail.com', 'BNGzXbZ7gK5_txezOTrpa0yJTr-84fPtacrezZNRD3Kvq8lj6WpC9bdouPm87Uu_vv5Uin0L0HupsQ35CscF56I', privateVapidKey);
             await webPush.sendNotification(subscription as any, JSON.stringify({ title, body, url }));
             sendCount++;
          }
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await subDoc.ref.delete();
          }
        }
      }
    }
    
    if (emailBccList.length > 0 && htmlContent) {
      const chunkSize = 50;
      for (let i = 0; i < emailBccList.length; i += chunkSize) {
          const chunk = emailBccList.slice(i, i + chunkSize);
          await db.collection('mail').add({
            to: 'alertacriminaloficial@gmail.com',
            bcc: chunk,
            message: { subject: title, text: body, html: htmlContent }
          });
      }
    }
    res.status(200).json({ message: `Notificação enviada com sucesso para ${sendCount} dispositivos e ${emailBccList.length} emails.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao enviar notificações' });
  }
});

app.post("/api/test-whatsapp", verifyFirebaseToken, async (req, res) => {
  const { to, name } = req.body;
  if (!to) {
    res.status(400).json({ success: false, error: "Número de destino (to) é obrigatório." });
    return;
  }
  
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    res.status(500).json({ success: false, error: "Integração com WhatsApp não configurada." });
    return;
  }
  try {
    const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const from = TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:') ? TWILIO_WHATSAPP_NUMBER : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;
    const dest = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    await twilioClient.messages.create({
      body: `🚨 *Alerta Criminal*\n\nOlá ${name || 'Guardião'}! 👋\n\nTeste concluído!`,
      from: from,
      to: dest
    });
    res.json({ success: true, message: "WhatsApp enviado com sucesso!" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export const api = onRequest({ cors: true }, app);

export const weeklySummary = onSchedule({
  schedule: "0 8 * * 0",
  timeZone: "America/Sao_Paulo",
}, async (event) => {
  const db = admin.firestore();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentReportsSnapshot = await db.collection('reports')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(oneWeekAgo))
    .get();
  
  const totalReports = recentReportsSnapshot.size;
  const usersSnapshot = await db.collection('users').get();
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    if (userData.notificationSettings?.email && userData.email && !userData.email.endsWith('@anonymous.com') && userData.termsAccepted === true) {
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
      await db.collection('mail').add({
        to: userData.email,
        message: {
          subject: 'Seu Resumo Semanal de Segurança',
          html: htmlContent
        }
      });
    }
  }
});
