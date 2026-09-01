import express from "express";
import path from "path";
import admin from "firebase-admin";
import fs from "fs";
import dotenv from "dotenv";
import twilio from "twilio";
import { startEmailCronJob, sendEmail } from "./emailService.ts";
import { GoogleGenAI } from '@google/genai';

dotenv.config({ override: true });

// Initialize AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

try {
  if (fs.existsSync('./firebase-applet-config.json')) {
    const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: config.projectId,
      });
      console.log("Firebase Admin initialized");
    }
    
    // Inicia o job de e-mails apenas se o Firebase Admin inicializar com sucesso
    startEmailCronJob();
  }
} catch (e) {
  console.error("Firebase Admin init error", e);
}

// Twilio Client Setup
let twilioClient: twilio.Twilio | null = null;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  try {
  if(TWILIO_ACCOUNT_SID.startsWith('AC')) { twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN); } else { console.warn('Twilio init skipped: TWILIO_ACCOUNT_SID must start with AC'); }
  } catch (e) {
    console.warn("Twilio init warning:", e);
  }
}

async function startServer() {
  const app = express();

  const isProduction = process.env.NODE_ENV === "production";
  const PORT = 3000;

  app.use(express.json());

  // Permitir que o site seja embutido via iframe
  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self' https://*.alertacriminal.com.br http://*.alertacriminal.com.br alertacriminal.com.br https://alerta-criminal-c1612.web.app https://alerta-criminal-c1612.firebaseapp.com"
    );
    res.removeHeader('X-Frame-Options');
    next();
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      
      const contents = messages.map((m: any) => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          systemInstruction: "Você é o Guardião Virtual, um assistente especializado em segurança pública e pessoal no Brasil. Dê dicas práticas, curtas e diretas sobre como evitar assaltos, rotas seguras, e o que fazer em emergências. Seja empático, calmo e prestativo. Nunca recomende reagir a assaltos.",
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Erro no chat:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/test-admin", async (req, res) => {
    try {
      const db = admin.firestore();
      const usersSnap = await db.collection('users').limit(1).get();
      res.json({ success: true, count: usersSnap.size });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/test-email", async (req, res) => {
    const { to, name } = req.body;
    if (!to) {
      return res.status(400).json({ success: false, error: "E-mail de destino (to) é obrigatório." });
    }

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Teste de E-mail - Alerta Criminal</h2>
        <p>Olá <strong>${name || 'Usuário'}</strong>,</p>
        <p>Este é um e-mail de teste para confirmar que a configuração do servidor SMTP está funcionando perfeitamente.</p>
        <br/>
        <p style="color: #64748b; font-size: 14px;">Equipe Alerta Criminal</p>
      </div>
    `;

    const success = await sendEmail(to, 'Teste de Configuração de E-mail', htmlContent);
    
    if (success) {
      res.json({ success: true, message: "E-mail enviado com sucesso!" });
    } else {
      res.status(500).json({ success: false, error: "Falha ao enviar e-mail. Verifique os logs do servidor e as credenciais SMTP." });
    }
  });

  app.post("/api/test-whatsapp", async (req, res) => {
    const { to, name } = req.body;
    if (!to) {
      return res.status(400).json({ success: false, error: "Número de destino (to) é obrigatório." });
    }

    if (!twilioClient || !TWILIO_WHATSAPP_NUMBER) {
      return res.status(500).json({ success: false, error: "Integração com WhatsApp não configurada. Verifique as chaves do Twilio nas configurações de Secrets do app." });
    }

    try {
      // O número de origem do Twilio no Sandbox deve ter o prefixo "whatsapp:"
      const from = TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:') ? TWILIO_WHATSAPP_NUMBER : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;
      const dest = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      const message = await twilioClient.messages.create({
        body: `🚨 *Alerta Criminal*\n\nOlá ${name || 'Guardião'}! 👋\n\nEste é um teste automatizado confirmando que a sua integração de segurança com o *WhatsApp* pelo Twilio está 100% FUNCIONAL!\n\nAgora você está pronto para receber alertas em tempo real.`,
        from: from,
        to: dest
      });

      console.log("WhatsApp enviado:", message.sid);
      res.json({ success: true, message: "WhatsApp enviado com sucesso!" });
    } catch (error: any) {
      console.error("Erro ao enviar WhatsApp:", error);
      res.status(500).json({ success: false, error: error.message || "Falha ao disparar pelo Twilio" });
    }
  });


  const distPath = path.join(process.cwd(), 'dist');

  if (isProduction && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Vite middleware for development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  });
}

startServer();
